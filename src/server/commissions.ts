import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getStoreConfig } from "@/lib/config";
import { COMMISSION_DEPTH, MS_PER_DAY } from "@/lib/commissions";

/**
 * PrismaClient è assegnabile a TransactionClient, quindi ogni helper qui sotto
 * funziona sia dentro una $transaction sia standalone.
 */
export type Tx = Prisma.TransactionClient;

// ─────────────────────────────────────────────────────────────
// ALBERO UNILEVEL
// ─────────────────────────────────────────────────────────────

export type UplineRow = { userId: string; level: number };

/**
 * Risale fino a COMMISSION_DEPTH livelli di sponsor a partire dall'acquirente.
 *
 * Una CTE ricorsiva invece di 5 query sequenziali: markOrderPaid gira dentro una
 * transazione interattiva Prisma (timeout stretto) e su Neon serverless ogni
 * round-trip in più conta.
 *
 * Protezioni, tutte a carico di Postgres:
 *  - auto-acquisto: l'acquirente è il seme di `path`, non può mai comparire;
 *  - cicli: `path` cresce ad ogni giro e si esclude con <> ALL(path);
 *  - auto-sponsorizzazione: sponsorId <> id;
 *  - catena più corta di 5: produce semplicemente meno righe.
 */
export async function findUpline(tx: Tx, buyerId: string): Promise<UplineRow[]> {
  return tx.$queryRaw<UplineRow[]>`
    WITH RECURSIVE upline AS (
      SELECT u."sponsorId" AS "userId", 1 AS level, ARRAY[u.id] AS path
      FROM "User" u
      WHERE u.id = ${buyerId}
        AND u."sponsorId" IS NOT NULL
        AND u."sponsorId" <> u.id
      UNION ALL
      SELECT s."sponsorId", up.level + 1, up.path || s.id
      FROM upline up
      JOIN "User" s ON s.id = up."userId"
      WHERE up.level < ${COMMISSION_DEPTH}
        AND s."sponsorId" IS NOT NULL
        AND s."sponsorId" <> s.id
        AND s."sponsorId" <> ALL(up.path)
    )
    SELECT "userId", level FROM upline ORDER BY level
  `;
}

export type DownlineCount = { level: number; count: number };

/** Quante persone ci sono a ciascun livello sotto un utente. */
export async function downlineCounts(userId: string): Promise<DownlineCount[]> {
  return prisma.$queryRaw<DownlineCount[]>`
    WITH RECURSIVE downline AS (
      SELECT u.id, 1 AS level, ARRAY[${userId}::text] AS path
      FROM "User" u
      WHERE u."sponsorId" = ${userId} AND u.id <> ${userId}
      UNION ALL
      SELECT c.id, d.level + 1, d.path || d.id
      FROM downline d
      JOIN "User" c ON c."sponsorId" = d.id
      WHERE d.level < ${COMMISSION_DEPTH} AND c.id <> ALL(d.path)
    )
    SELECT level, COUNT(*)::int AS count
    FROM downline GROUP BY level ORDER BY level
  `;
}

export type DownlineMember = {
  id: string;
  name: string | null;
  email: string;
  level: number;
  createdAt: Date;
};

/**
 * Elenco della downline, limitato: un albero a 5 livelli cresce in modo
 * esponenziale e non va mai materializzato per intero in memoria.
 */
export async function downlineMembers(userId: string, limit = 100): Promise<DownlineMember[]> {
  return prisma.$queryRaw<DownlineMember[]>`
    WITH RECURSIVE downline AS (
      SELECT u.id, u.name, u.email, u."createdAt", 1 AS level, ARRAY[${userId}::text] AS path
      FROM "User" u
      WHERE u."sponsorId" = ${userId} AND u.id <> ${userId}
      UNION ALL
      SELECT c.id, c.name, c.email, c."createdAt", d.level + 1, d.path || d.id
      FROM downline d
      JOIN "User" c ON c."sponsorId" = d.id
      WHERE d.level < ${COMMISSION_DEPTH} AND c.id <> ALL(d.path)
    )
    SELECT id, name, email, level, "createdAt"
    FROM downline ORDER BY level, "createdAt" DESC LIMIT ${limit}
  `;
}

// ─────────────────────────────────────────────────────────────
// SALDI
// ─────────────────────────────────────────────────────────────

/**
 * Ricalcola i 4 bucket denormalizzati dal ledger, in modo ASSOLUTO.
 *
 * Si usa questo (e non un increment) in tutte le transizioni che spostano
 * denaro fra bucket — maturazione, prelievo, storno — perché lì un delta
 * sbagliato corromperebbe due colonne insieme e il danno resterebbe invisibile.
 */
export async function recomputeCommissionBalances(tx: Tx, accountIds: string[]) {
  const unique = [...new Set(accountIds)];
  for (const accountId of unique) {
    const rows = await tx.commission.groupBy({
      by: ["status"],
      where: { accountId },
      _sum: { amountCents: true },
    });
    const requested = await tx.commission.aggregate({
      where: { accountId, status: "APPROVED", payoutRequestId: { not: null } },
      _sum: { amountCents: true },
    });

    const byStatus = (s: string) =>
      rows.find((r) => r.status === s)?._sum.amountCents ?? 0;

    const requestedCents = requested._sum.amountCents ?? 0;
    await tx.commissionAccount.update({
      where: { id: accountId },
      data: {
        pendingCents: byStatus("PENDING"),
        availableCents: byStatus("APPROVED") - requestedCents,
        requestedCents,
        paidCents: byStatus("PAID"),
      },
    });
  }
}

/**
 * Porta ad APPROVED le provvigioni la cui finestra resi è scaduta.
 *
 * Chiamata dal cron giornaliero, ma anche da requestPayout con `userId`: così un
 * cron saltato non può mai bloccare né sottopagare un prelievo.
 */
export async function matureDueCommissions(tx: Tx, userId?: string) {
  const now = new Date();
  const where: Prisma.CommissionWhereInput = {
    status: "PENDING",
    maturesAt: { lte: now },
    ...(userId ? { account: { userId } } : {}),
  };

  const due = await tx.commission.findMany({ where, select: { accountId: true } });
  if (due.length === 0) return { matured: 0 };

  await tx.commission.updateMany({ where, data: { status: "APPROVED", approvedAt: now } });
  await recomputeCommissionBalances(tx, due.map((c) => c.accountId));
  return { matured: due.length };
}

/** Recupera (o crea) il conto provvigioni di un utente. */
export async function getOrCreateCommissionAccount(userId: string) {
  return prisma.commissionAccount.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

/**
 * Allinea `maturesAt` alla data di consegna reale.
 * La consegna può solo ANTICIPARE la maturazione rispetto al fallback: mai posticiparla.
 */
export async function applyDeliveryMaturation(tx: Tx, orderId: string, deliveredAt: Date) {
  const config = await getStoreConfig();
  const maturesAt = new Date(deliveredAt.getTime() + config.commissionMaturationDays * MS_PER_DAY);
  await tx.commission.updateMany({
    where: { orderId, status: "PENDING", maturesAt: { gt: maturesAt } },
    data: { maturesAt },
  });
}
