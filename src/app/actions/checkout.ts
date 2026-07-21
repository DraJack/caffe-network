"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { stripe, STRIPE_ENABLED } from "@/lib/stripe";
import { CART_COOKIE } from "@/server/cart";
import { createOrderFromCart, markOrderPaid } from "@/server/orders";

const schema = z.object({
  email: z.string().email("Email non valida"),
  name: z.string().min(2, "Nome richiesto"),
  line1: z.string().min(3, "Indirizzo richiesto"),
  line2: z.string().optional(),
  city: z.string().min(2, "Città richiesta"),
  province: z.string().min(2, "Provincia richiesta"),
  postalCode: z.string().min(4, "CAP richiesto"),
});

export type CheckoutState = { error?: string } | undefined;

export async function startCheckout(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const token = (await cookies()).get(CART_COOKIE)?.value;
  if (!token) return { error: "Carrello non trovato" };

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dati non validi" };

  const session = await auth();
  const userId = session?.user?.id;

  let order;
  try {
    order = await createOrderFromCart({
      cartToken: token,
      userId,
      shipping: parsed.data,
    });
  } catch {
    return { error: "Il carrello è vuoto o non valido" };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const items = await prisma.orderItem.findMany({ where: { orderId: order.id } });

  // ── Modalità demo: nessuna chiave Stripe reale → evadi subito (ambiente di test) ──
  if (!STRIPE_ENABLED) {
    await markOrderPaid(order.id);
    redirect(`/checkout/success?order=${order.number}&demo=1`);
  }

  // ── Stripe Checkout ──
  const lineItems = items.map((it) => ({
    price_data: {
      currency: "eur",
      unit_amount: it.priceCents,
      product_data: { name: it.name },
    },
    quantity: it.quantity,
  }));
  if (order.shippingCents > 0) {
    lineItems.push({
      price_data: {
        currency: "eur",
        unit_amount: order.shippingCents,
        product_data: { name: "Spedizione" },
      },
      quantity: 1,
    });
  }

  const discounts: { coupon: string }[] = [];
  if (order.discountCents > 0) {
    const coupon = await stripe.coupons.create({
      amount_off: order.discountCents,
      currency: "eur",
      duration: "once",
      name: "Sconto",
    });
    discounts.push({ coupon: coupon.id });
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    discounts,
    customer_email: order.email,
    metadata: { orderId: order.id },
    success_url: `${appUrl}/checkout/success?order=${order.number}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/carrello`,
  });

  await prisma.payment.update({
    where: { orderId: order.id },
    data: { stripeSessionId: checkout.id },
  });

  redirect(checkout.url!);
}
