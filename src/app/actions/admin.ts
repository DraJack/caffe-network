"use server";

import { revalidatePath } from "next/cache";
import type { OrderStatus, Role } from "@prisma/client";
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
  await prisma.product.update({ where: { id: productId }, data: { [field]: value } });
  revalidatePath("/admin/prodotti");
}

export async function updateVariant(variantId: string, priceCents: number, stock: number) {
  await requireAdmin();
  await prisma.productVariant.update({
    where: { id: variantId },
    data: { priceCents: Math.max(0, priceCents), stock: Math.max(0, stock) },
  });
  revalidatePath("/admin/prodotti");
}

export async function updateUserRole(userId: string, role: Role) {
  await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/utenti");
}

export async function updateStoreConfig(data: {
  flatShippingCents: number;
  freeShippingThreshold: number;
  commissionL1Cents: number;
  commissionL2Cents: number;
  commissionL3Cents: number;
  commissionL4Cents: number;
  commissionL5Cents: number;
  maxCommissionPercent: number;
  commissionMaturationDays: number;
  commissionFallbackDays: number;
  minPayoutCents: number;
}) {
  await requireAdmin();
  await prisma.storeConfig.upsert({
    where: { id: "default" },
    update: data,
    create: { id: "default", ...data },
  });
  revalidatePath("/admin/impostazioni");
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
