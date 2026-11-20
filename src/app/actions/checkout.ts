"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { stripe, STRIPE_ENABLED } from "@/lib/stripe";
import { CART_COOKIE } from "@/server/cart";
import { LAST_ORDER_COOKIE } from "@/lib/order-status";
import { CheckoutError, createOrderFromCart, markOrderPaid } from "@/server/orders";

const schema = z.object({
  email: z.string().trim().email("Email non valida").max(254),
  name: z.string().trim().min(2, "Nome richiesto").max(100, "Nome troppo lungo"),
  line1: z.string().trim().min(3, "Indirizzo richiesto").max(200, "Indirizzo troppo lungo"),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2, "Città richiesta").max(100),
  province: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, "Provincia: usa la sigla di 2 lettere (es. MI)"),
  postalCode: z.string().trim().regex(/^\d{5}$/, "CAP non valido (5 cifre)"),
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
  } catch (error) {
    if (error instanceof CheckoutError) return { error: error.message };
    console.error("createOrderFromCart:", error);
    return { error: "Non è stato possibile creare l'ordine. Riprova." };
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const items = await prisma.orderItem.findMany({ where: { orderId: order.id } });

  // Chi ha appena ordinato (anche da ospite) può rivedere il riepilogo nella
  // pagina di conferma; chiunque altro, con il solo numero d'ordine, no.
  (await cookies()).set(LAST_ORDER_COOKIE, order.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/checkout",
    maxAge: 60 * 60 * 24,
    secure: process.env.NODE_ENV === "production",
  });

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
