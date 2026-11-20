import "server-only";
import { prisma } from "@/lib/prisma";
import { getStoreConfig } from "@/lib/config";
import { commissionableUnits, computeCommissionSplit, MS_PER_DAY } from "@/lib/commissions";
import { findUpline } from "@/server/commissions";

export type ShippingInput = {
  email: string;
  name: string;
  line1: string;
  line2?: string;
  city: string;
  province: string;
  postalCode: string;
};

/** Errore mostrabile all'utente in checkout (messaggio già in italiano). */
export class CheckoutError extends Error {}

/**
 * Crea un ordine PENDING a partire da un carrello, ricalcolando i totali lato server.
 * Svuota il carrello (i dati sono già "snapshottati" nell'ordine).
 */
export async function createOrderFromCart(params: {
  cartToken: string;
  userId?: string;
  shipping: ShippingInput;
}) {
  const { cartToken, userId, shipping } = params;
  const config = await getStoreConfig();

  const cart = await prisma.cart.findUnique({
    where: { token: cartToken },
    include: { items: { include: { variant: { include: { product: true } } } } },
  });
  if (!cart || cart.items.length === 0) throw new CheckoutError("Il carrello è vuoto");

  const items = cart.items;
  // Ultima linea di difesa prima del pagamento: il carrello può essere vecchio di
  // giorni (prodotto disattivato, stock esaurito nel frattempo) o manomesso.
  for (const it of items) {
    if (!Number.isInteger(it.quantity) || it.quantity <= 0) {
      throw new CheckoutError("Il carrello contiene una quantità non valida");
    }
    if (!it.variant.product.active) {
      throw new CheckoutError(`«${it.variant.product.name}» non è più disponibile`);
    }
    if (it.quantity > it.variant.stock) {
      throw new CheckoutError(
        it.variant.stock > 0
          ? `Disponibili solo ${it.variant.stock} pezzi di «${it.variant.product.name}»`
          : `«${it.variant.product.name}» è esaurito`,
      );
    }
  }
  const subtotalCents = items.reduce((s, it) => s + it.variant.priceCents * it.quantity, 0);
  const shippingCents =
    subtotalCents >= config.freeShippingThreshold ? 0 : config.flatShippingCents;

  // Nessuno sconto attivo al momento (i coupon arriveranno qui).
  const discountCents = 0;

  const totalCents = Math.max(0, subtotalCents - discountCents) + shippingCents;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        userId: userId ?? null,
        email: shipping.email.toLowerCase(),
        status: "PENDING",
        subtotalCents,
        shippingCents,
        discountCents,
        totalCents,
        shippingName: shipping.name,
        shippingLine1: shipping.line1,
        shippingLine2: shipping.line2 || null,
        shippingCity: shipping.city,
        shippingProvince: shipping.province,
        shippingPostal: shipping.postalCode,
        items: {
          create: items.map((it) => ({
            variantId: it.variantId,
            name: `${it.variant.product.name} — ${it.variant.name}`,
            sku: it.variant.sku,
            priceCents: it.variant.priceCents,
            quantity: it.quantity,
            // Snapshot: le provvigioni non devono cambiare se la variante viene modificata.
            commissionUnits: it.variant.commissionUnits,
          })),
        },
        payment: { create: { amountCents: totalCents, status: "PENDING" } },
      },
    });
    // svuota il carrello
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    return created;
  });

  return order;
}

/**
 * Evade un ordine dopo il pagamento. Idempotente: agisce solo se lo stato è PENDING.
 * Scala lo stock, matura le provvigioni dell'upline, marca l'ordine come PAID.
 */
export async function markOrderPaid(
  orderId: string,
  paymentRef?: { paymentIntentId?: string; sessionId?: string },
) {
  const config = await getStoreConfig();

  await prisma.$transaction(async (tx) => {
    // Guardia di idempotenza ATOMICA: si "prenota" l'ordine con un update
    // condizionato. Un findUnique + controllo dello stato non basta: con due
    // webhook Stripe simultanei (o webhook + fallback) entrambe le transazioni
    // leggono PENDING in READ COMMITTED e scalano lo stock due volte. Così la
    // seconda resta bloccata sul lock di riga e poi trova 0 righe aggiornate.
    const claimed = await tx.order.updateMany({
      where: { id: orderId, status: "PENDING" },
      data: { status: "PAID" },
    });
    if (claimed.count === 0) return; // già evaso, annullato o inesistente

    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true },
    });

    // Scala lo stock
    for (const it of order.items) {
      if (it.variantId) {
        await tx.productVariant.update({
          where: { id: it.variantId },
          data: { stock: { decrement: it.quantity } },
        });
      }
    }

    // ── Provvigioni unilevel (solo utenti registrati) ──
    // Sta dentro questa transazione di proposito: eredita la guardia di idempotenza
    // sopra, quindi un webhook Stripe duplicato non può generare provvigioni doppie.
    if (order.userId) {
      const upline = await findUpline(tx, order.userId);
      if (upline.length > 0) {
        const split = computeCommissionSplit({
          units: commissionableUnits(order.items),
          basisCents: order.subtotalCents - order.discountCents,
          levels: upline.map((u) => u.level),
          rules: config,
        });
        const byLevel = new Map(upline.map((u) => [u.level, u.userId]));

        // Rete di sicurezza: se l'admin non segnasse mai l'ordine come DELIVERED,
        // la provvigione matura comunque dopo commissionFallbackDays dal pagamento.
        // La consegna può solo ANTICIPARE questa data, mai bloccarla.
        const maturesAt = new Date(
          Date.now() + config.commissionFallbackDays * MS_PER_DAY,
        );

        for (const row of split) {
          const earnerId = byLevel.get(row.level);
          if (!earnerId || earnerId === order.userId) continue; // difesa auto-acquisto

          const account = await tx.commissionAccount.upsert({
            where: { userId: earnerId },
            update: {},
            create: { userId: earnerId },
          });
          await tx.commission.create({
            data: {
              accountId: account.id,
              orderId: order.id,
              buyerId: order.userId,
              level: row.level,
              units: row.units,
              rateCents: row.rateCents,
              amountCents: row.amountCents,
              reason: "ORDER",
              status: "PENDING",
              maturesAt,
            },
          });
          await tx.commissionAccount.update({
            where: { id: account.id },
            data: { pendingCents: { increment: row.amountCents } },
          });
        }
      }
    }

    await tx.payment.update({
      where: { orderId: order.id },
      data: {
        status: "SUCCEEDED",
        stripePaymentIntentId: paymentRef?.paymentIntentId ?? null,
        stripeSessionId: paymentRef?.sessionId ?? null,
      },
    });
    // Il default di 5s è troppo stretto: qui c'è lo scarico stock, la risalita
    // dell'upline e fino a 5 righe di provvigione, su un DB serverless.
  }, { timeout: 15_000, maxWait: 5_000 });
}
