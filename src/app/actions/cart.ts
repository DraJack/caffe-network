"use server";

import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CART_COOKIE } from "@/server/cart";

// Le Server Actions sono endpoint pubblici: gli argomenti arrivano dal client e
// vanno validati qui, non solo nella UI. Senza questo controllo una quantità
// negativa abbassava il totale del carrello (3 confezioni + "-2" = 70 €).
const MAX_QTY_PER_LINE = 99;
const idSchema = z.string().min(1).max(64);
const qtySchema = z.number().int().min(1).max(MAX_QTY_PER_LINE);

type CartResult = { ok: boolean; error?: string };

/** Carrello del cookie corrente, senza crearlo. */
async function currentCartId(): Promise<string | null> {
  const token = (await cookies()).get(CART_COOKIE)?.value;
  if (!token) return null;
  const cart = await prisma.cart.findUnique({ where: { token }, select: { id: true } });
  return cart?.id ?? null;
}

/** Recupera il carrello dal cookie o ne crea uno nuovo (impostando il cookie). */
async function ensureCart(): Promise<string> {
  const existing = await currentCartId();
  if (existing) return existing;

  const store = await cookies();
  const token = randomUUID();
  const session = await auth();
  const cart = await prisma.cart.create({
    data: { token, userId: session?.user?.id ?? null },
  });
  store.set(CART_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  });
  return cart.id;
}

export async function addToCart(variantId: string, quantity = 1): Promise<CartResult> {
  const parsed = z.object({ variantId: idSchema, quantity: qtySchema }).safeParse({
    variantId,
    quantity,
  });
  if (!parsed.success) return { ok: false, error: "Quantità non valida" };

  const variant = await prisma.productVariant.findUnique({
    where: { id: parsed.data.variantId },
    include: { product: { select: { active: true } } },
  });
  if (!variant || !variant.product.active) return { ok: false, error: "Prodotto non disponibile" };
  if (variant.stock <= 0) return { ok: false, error: "Prodotto esaurito" };

  const cartId = await ensureCart();
  const existing = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId, variantId: variant.id } },
  });
  const cap = Math.min(variant.stock, MAX_QTY_PER_LINE);
  const nextQty = Math.min((existing?.quantity ?? 0) + parsed.data.quantity, cap);

  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId, variantId: variant.id } },
    update: { quantity: nextQty },
    create: { cartId, variantId: variant.id, quantity: nextQty },
  });

  revalidatePath("/carrello");
  return { ok: true };
}

export async function updateCartItem(itemId: string, quantity: number): Promise<CartResult> {
  const id = idSchema.safeParse(itemId);
  const qty = z.number().int().min(0).max(MAX_QTY_PER_LINE).safeParse(quantity);
  if (!id.success || !qty.success) return { ok: false, error: "Quantità non valida" };

  // Si agisce solo sulle righe del PROPRIO carrello: l'id riga arriva dal client.
  const cartId = await currentCartId();
  if (!cartId) return { ok: false, error: "Carrello non trovato" };

  if (qty.data === 0) {
    await prisma.cartItem.deleteMany({ where: { id: id.data, cartId } });
  } else {
    const item = await prisma.cartItem.findFirst({
      where: { id: id.data, cartId },
      include: { variant: true },
    });
    if (item) {
      await prisma.cartItem.update({
        where: { id: item.id },
        data: { quantity: Math.max(1, Math.min(qty.data, item.variant.stock)) },
      });
    }
  }
  revalidatePath("/carrello");
  return { ok: true };
}

export async function removeCartItem(itemId: string): Promise<CartResult> {
  const id = idSchema.safeParse(itemId);
  if (!id.success) return { ok: false };
  const cartId = await currentCartId();
  if (cartId) await prisma.cartItem.deleteMany({ where: { id: id.data, cartId } });
  revalidatePath("/carrello");
  return { ok: true };
}
