"use server";

import { revalidatePath } from "next/cache";
import type { OrderStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { formatEuro } from "@/lib/utils";
import { applyDeliveryMaturation, recomputeCommissionBalances } from "@/server/commissions";

/**
 * Cambia lo stato di un ordine gestendo gli effetti collaterali.
 *
 * DELIVERED  → stampa deliveredAt e anticipa la maturazione delle provvigioni.
 * CANCELLED  → ripristina lo stock e storna le provvigioni non ancora liquidate.
 *
 * Ritorna un eventuale avviso da mostrare all'admin (provvigioni già pagate che
 * vanno recuperate a mano).
 */
export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  await requireAdmin();

  const warning = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, deliveredAt: true, items: true },
    });
    if (!order || order.status === status) return null;

    let warn: string | null = null;

    if (status === "DELIVERED") {
      // Idempotente: una seconda consegna non sposta la data originale.
      const deliveredAt = order.deliveredAt ?? new Date();
      await tx.order.update({ where: { id: orderId }, data: { deliveredAt } });
      await applyDeliveryMaturation(tx, orderId, deliveredAt);
    }

    if (status === "CANCELLED") {
      // Ripristina lo stock solo se era già stato scalato (cioè da PAID in poi).
      if (order.status !== "PENDING") {
        for (const it of order.items) {
          if (it.variantId) {
            await tx.productVariant.update({
              where: { id: it.variantId },
              data: { stock: { increment: it.quantity } },
            });
          }
        }
      }

      // Le righe già PAID NON si stornano: il denaro è uscito davvero e marcarle
      // REVERSED corromperebbe paidCents. L'admin viene avvisato esplicitamente.
      const alreadyPaid = await tx.commission.aggregate({
        where: { orderId, status: "PAID" },
        _sum: { amountCents: true },
      });
      const affected = await tx.commission.findMany({
        where: { orderId, status: { in: ["PENDING", "APPROVED"] } },
        select: { accountId: true, payoutRequestId: true },
      });
      if (affected.length > 0) {
        await tx.commission.updateMany({
          where: { orderId, status: { in: ["PENDING", "APPROVED"] } },
          data: { status: "REVERSED", payoutRequestId: null, note: "Ordine annullato" },
        });

        // Una provvigione stornata può trovarsi dentro una richiesta di prelievo
        // già inviata: senza questo ricalcolo l'admin liquiderebbe un importo
        // che include righe non più valide.
        const touchedPayouts = [
          ...new Set(affected.map((c) => c.payoutRequestId).filter((id): id is string => !!id)),
        ];
        for (const payoutId of touchedPayouts) {
          const payout = await tx.payoutRequest.findUnique({ where: { id: payoutId } });
          if (!payout || payout.status !== "REQUESTED") continue;

          const remaining = await tx.commission.aggregate({
            where: { payoutRequestId: payoutId, status: "APPROVED" },
            _sum: { amountCents: true },
          });
          const newAmount = remaining._sum.amountCents ?? 0;
          if (newAmount === 0) {
            await tx.payoutRequest.update({
              where: { id: payoutId },
              data: {
                status: "REJECTED",
                processedAt: new Date(),
                amountCents: 0,
                adminNote: "Annullata: tutte le provvigioni collegate sono state stornate.",
              },
            });
          } else {
            await tx.payoutRequest.update({
              where: { id: payoutId },
              data: { amountCents: newAmount },
            });
          }
          warn = `Una richiesta di prelievo aperta è stata ricalcolata a ${formatEuro(newAmount)}.`;
        }

        await recomputeCommissionBalances(tx, affected.map((c) => c.accountId));
      }

      const paidCents = alreadyPaid._sum.amountCents ?? 0;
      if (paidCents > 0) {
        warn = `${formatEuro(paidCents)} di provvigioni su questo ordine sono già stati liquidati: vanno recuperati manualmente.`;
      }
    }

    await tx.order.update({ where: { id: orderId }, data: { status } });
    return warn;
  }, { timeout: 15_000, maxWait: 5_000 });

  revalidatePath("/admin/ordini");
  revalidatePath("/admin/provvigioni");
  return { warning };
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
export async function markPayoutPaid(payoutId: string, adminNote?: string) {
  await requireAdmin();
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const payout = await tx.payoutRequest.findUnique({ where: { id: payoutId } });
    if (!payout || payout.status !== "REQUESTED") return; // idempotente

    await tx.commission.updateMany({
      where: { payoutRequestId: payoutId, status: "APPROVED" },
      data: { status: "PAID", paidAt: now },
    });
    await tx.payoutRequest.update({
      where: { id: payoutId },
      data: { status: "PAID", processedAt: now, adminNote: adminNote ?? null },
    });
    await recomputeCommissionBalances(tx, [payout.accountId]);
  }, { timeout: 15_000, maxWait: 5_000 });

  revalidatePath("/admin/payout");
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
