import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getStoreConfig } from "@/lib/config";

export const CART_COOKIE = "cn_cart";

/** Carrello arricchito con dati prodotto e totali calcolati. */
export type CartView = Awaited<ReturnType<typeof getCart>>;

/** Legge il carrello corrente dal cookie. Non crea nulla (safe in RSC). */
export async function getCart() {
  const token = (await cookies()).get(CART_COOKIE)?.value;
  if (!token) return emptyCart();

  const cart = await prisma.cart.findUnique({
    where: { token },
    include: {
      items: {
        include: { variant: { include: { product: true } } },
        orderBy: { id: "asc" },
      },
    },
  });
  if (!cart) return emptyCart();

  const items = cart.items.map((it) => ({
    id: it.id,
    variantId: it.variantId,
    quantity: it.quantity,
    name: it.variant.product.name,
    variantName: it.variant.name,
    slug: it.variant.product.slug,
    image: it.variant.product.images[0] ?? null,
    priceCents: it.variant.priceCents,
    lineCents: it.variant.priceCents * it.quantity,
    stock: it.variant.stock,
  }));

  const subtotalCents = items.reduce((s, it) => s + it.lineCents, 0);
  const count = items.reduce((s, it) => s + it.quantity, 0);
  const config = await getStoreConfig();
  const shippingCents =
    subtotalCents === 0 || subtotalCents >= config.freeShippingThreshold
      ? 0
      : config.flatShippingCents;

  return { id: cart.id, token, items, subtotalCents, shippingCents, count };
}

function emptyCart() {
  return {
    id: null as string | null,
    token: null as string | null,
    items: [] as CartLine[],
    subtotalCents: 0,
    shippingCents: 0,
    count: 0,
  };
}

type CartLine = {
  id: string;
  variantId: string;
  quantity: number;
  name: string;
  variantName: string;
  slug: string;
  image: string | null;
  priceCents: number;
  lineCents: number;
  stock: number;
};
