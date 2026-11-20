"use server";

import { revalidatePath } from "next/cache";
import { Role, type OrderStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { formatEuro } from "@/lib/utils";
import { recomputeCommissionBalances } from "@/server/commissions";
import { changeOrderStatus } from "@/server/orders";

/** Cambia lo stato di un ordine: regole ed effetti collaterali in changeOrderStatus. */
export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  await requireAdmin();
  const result = await changeOrderStatus(orderId, status);
  revalidatePath("/admin/ordini");
  revalidatePath("/admin/provvigioni");
  return result;
}

export async function toggleProductFlag(
  productId: string,
  field: "active" | "featured",
  value: boolean,
) {
  await requireAdmin();
  const key = z.enum(["active", "featured"]).parse(field);
  await prisma.product.update({ where: { id: productId }, data: { [key]: value === true } });
  revalidatePath("/admin/prodotti");
}

const variantSchema = z.object({
  priceCents: z.number().int().min(1, "Prezzo non valido").max(1_000_000),
  stock: z.number().int().min(0).max(1_000_000),
});

export async function updateVariant(
  variantId: string,
  priceCents: number,
  stock: number,
): Promise<{ error?: string }> {
  await requireAdmin();
  const parsed = variantSchema.safeParse({ priceCents, stock });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dati non validi" };
  await prisma.productVariant.update({ where: { id: variantId }, data: parsed.data });
  revalidatePath("/admin/prodotti");
  return {};
}

export async function updateUserRole(userId: string, role: Role): Promise<{ error?: string }> {
  const admin = await requireAdmin();
  // Un admin che si toglie il ruolo da solo resta chiuso fuori dal pannello.
  if (userId === admin.id && role !== "ADMIN") {
    return { error: "Non puoi rimuovere il ruolo admin a te stesso." };
  }
  await prisma.user.update({ where: { id: userId }, data: { role: z.enum(Role).parse(role) } });
  revalidatePath("/admin/utenti");
  return {};
}

const cents = z.number().int().min(0).max(100_000_00);
const configSchema = z
  .object({
    flatShippingCents: cents,
    freeShippingThreshold: cents,
    commissionL1Cents: cents,
    commissionL2Cents: cents,
    commissionL3Cents: cents,
    commissionL4Cents: cents,
    commissionL5Cents: cents,
    maxCommissionPercent: z.number().int().min(0).max(100, "Il tetto non può superare il 100%"),
    commissionMaturationDays: z.number().int().min(0).max(365),
    commissionFallbackDays: z.number().int().min(1).max(365),
    minPayoutCents: cents,
  })
  .refine((c) => c.commissionFallbackDays >= c.commissionMaturationDays, {
    message: "I giorni di maturazione di riserva devono essere almeno quelli dalla consegna",
  });

export async function updateStoreConfig(
  data: z.input<typeof configSchema>,
): Promise<{ error?: string }> {
  await requireAdmin();
  const parsed = configSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dati non validi" };
  await prisma.storeConfig.upsert({
    where: { id: "default" },
    update: parsed.data,
    create: { id: "default", ...parsed.data },
  });
  // Le tariffe compaiono anche in pagine pubbliche (piano, homepage, vetrine).
  revalidatePath("/", "layout");
  return {};
}

/** Segna una richiesta di prelievo come pagata (dopo il bonifico). */
export async function markPayoutPaid(
  payoutId: string,
  adminNote?: string,
): Promise<{ error?: string }> {
  await requireAdmin();
  const now = new Date();

  const error = await prisma.$transaction(async (tx) => {
    const payout = await tx.payoutRequest.findUnique({ where: { id: payoutId } });
    if (!payout || payout.status !== "REQUESTED") return null; // idempotente

    // Difesa in profondità: l'importo da bonificare deve coincidere con le righe
    // agganciate. Se non torna (dati corrotti, vecchie richieste duplicate) meglio
    // fermarsi che pagare un saldo senza copertura nel ledger.
    const linked = await tx.commission.aggregate({
      where: { payoutRequestId: payoutId, status: "APPROVED" },
      _sum: { amountCents: true },
    });
    if ((linked._sum.amountCents ?? 0) !== payout.amountCents) {
      return `Richiesta incoerente: ${formatEuro(payout.amountCents)} richiesti ma ${formatEuro(linked._sum.amountCents ?? 0)} di provvigioni collegate. Rifiutala e falla ripresentare.`;
    }

    await tx.commission.updateMany({
      where: { payoutRequestId: payoutId, status: "APPROVED" },
      data: { status: "PAID", paidAt: now },
    });
    await tx.payoutRequest.update({
      where: { id: payoutId },
      data: { status: "PAID", processedAt: now, adminNote: adminNote ?? null },
    });
    await recomputeCommissionBalances(tx, [payout.accountId]);
    return null;
  }, { timeout: 15_000, maxWait: 5_000 });

  revalidatePath("/admin/payout");
  return error ? { error } : {};
}

/** Rifiuta una richiesta: le provvigioni tornano disponibili. */
export async function rejectPayout(payoutId: string, adminNote?: string) {
  await requireAdmin();

  await prisma.$transaction(async (tx) => {
    const payout = await tx.payoutRequest.findUnique({ where: { id: payoutId } });
    if (!payout || payout.status !== "REQUESTED") return;

    // Sgancia le righe: tornano APPROVED senza richiesta ⇒ di nuovo disponibili.
    await tx.commission.updateMany({
      where: { payoutRequestId: payoutId },
      data: { payoutRequestId: null },
    });
    await tx.payoutRequest.update({
      where: { id: payoutId },
      data: { status: "REJECTED", processedAt: new Date(), adminNote: adminNote ?? null },
    });
    await recomputeCommissionBalances(tx, [payout.accountId]);
  }, { timeout: 15_000, maxWait: 5_000 });

  revalidatePath("/admin/payout");
}

/**
 * Riallinea i saldi denormalizzati al ledger per tutti i conti.
 * Pulsante di auto-riparazione: i saldi sono una cache, questa è la fonte di verità.
 */
export async function recalcCommissionBalances() {
  await requireAdmin();
  const accounts = await prisma.commissionAccount.findMany({ select: { id: true } });
  await prisma.$transaction(
    async (tx) => recomputeCommissionBalances(tx, accounts.map((a) => a.id)),
    { timeout: 30_000, maxWait: 5_000 },
  );
  revalidatePath("/admin/provvigioni");
}
