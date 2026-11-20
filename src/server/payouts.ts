import "server-only";
import { prisma } from "@/lib/prisma";
import { getStoreConfig } from "@/lib/config";
import { formatEuro } from "@/lib/utils";
import { matureDueCommissions, recomputeCommissionBalances } from "@/server/commissions";

export type PayoutResult = { error?: string; success?: string };

/**
 * Crea una richiesta di prelievo con tutte le provvigioni disponibili.
 *
 * Matura le provvigioni scadute PRIMA di calcolare il disponibile: così il
 * prelievo è corretto anche se il cron giornaliero non è passato.
 *
 * Concorrenza: la riga CommissionAccount viene bloccata (FOR UPDATE) prima del
 * controllo "una sola richiesta aperta". Senza il lock due richieste parallele
 * (doppio clic, due schede) passavano entrambe il controllo: nascevano due
 * PayoutRequest con lo stesso importo, ma le provvigioni restavano agganciate
 * solo alla seconda — l'admin avrebbe pagato due volte lo stesso saldo.
 */
export async function createPayoutRequest(
  userId: string,
  bank: { holderName: string; iban: string },
): Promise<PayoutResult> {
  const config = await getStoreConfig();

  return prisma.$transaction(async (tx) => {
    const account = await tx.commissionAccount.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    await tx.$executeRaw`SELECT id FROM "CommissionAccount" WHERE id = ${account.id} FOR UPDATE`;

    // Una sola richiesta aperta per volta: evita doppi prelievi dello stesso saldo.
    const open = await tx.payoutRequest.findFirst({
      where: { accountId: account.id, status: "REQUESTED" },
    });
    if (open) return { error: "Hai già una richiesta di prelievo in lavorazione." };

    await matureDueCommissions(tx, userId);

    // Fonte di verità: il ledger, non il saldo denormalizzato.
    const eligible = await tx.commission.findMany({
      where: { accountId: account.id, status: "APPROVED", payoutRequestId: null },
      select: { id: true, amountCents: true },
    });
    const amountCents = eligible.reduce((s, c) => s + c.amountCents, 0);

    if (amountCents < config.minPayoutCents) {
      return {
        error: `Il minimo prelevabile è ${formatEuro(config.minPayoutCents)}. Disponibile: ${formatEuro(amountCents)}.`,
      };
    }

    const payout = await tx.payoutRequest.create({
      data: { accountId: account.id, amountCents, ...bank },
    });
    await tx.commission.updateMany({
      where: { id: { in: eligible.map((c) => c.id) } },
      data: { payoutRequestId: payout.id },
    });
    await recomputeCommissionBalances(tx, [account.id]);

    return { success: `Richiesta inviata: ${formatEuro(amountCents)}.` };
  }, { timeout: 15_000, maxWait: 5_000 });
}
