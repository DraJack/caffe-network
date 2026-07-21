"use server";

import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CART_COOKIE } from "@/server/cart";

/** Recupera il token carrello dal cookie o ne crea uno nuovo (impostando il cookie). */
async function ensureCart(): Promise<string> {
  const store = await cookies();
  let token = store.get(CART_COOKIE)?.value;

  if (token) {
    const existing = await prisma.cart.findUnique({ where: { token } });
    if (existing) return existing.id;
  }

  token = randomUUID();
  const session = await auth();
  const cart = await prisma.cart.create({
    data: { token, userId: session?.user?.id ?? null },
  });
  store.set(CART_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return cart.id;
}

export async function addToCart(variantId: string, quantity = 1) {
  const cartId = await ensureCart();
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) return { ok: false, error: "Variante non trovata" };

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId, variantId } },
  });
  const nextQty = Math.min((existing?.quantity ?? 0) + quantity, variant.stock);

  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId, variantId } },
    update: { quantity: nextQty },
    create: { cartId, variantId, quantity: Math.min(quantity, variant.stock) },
  });

  revalidatePath("/carrello");
  return { ok: true };
}

export async function updateCartItem(itemId: string, quantity: number) {
  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } }).catch(() => {});
  } else {
    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { variant: true },
    });
    if (item) {
      await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity: Math.min(quantity, item.variant.stock) },
      });
    }
  }
  revalidatePath("/carrello");
  return { ok: true };
}

export async function removeCartItem(itemId: string) {
  await prisma.cartItem.delete({ where: { id: itemId } }).catch(() => {});
  revalidatePath("/carrello");
  return { ok: true };
}
