import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type ProductSpec = { label: string; value: string };

/**
 * `Product.specs` è Json: si valida qui, al confine, così un valore malformato
 * scritto a mano in Prisma Studio fa sparire la scheda invece di rompere la pagina.
 */
export function parseSpecs(raw: Prisma.JsonValue | null): ProductSpec[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((s) =>
    s && typeof s === "object" && !Array.isArray(s) &&
    typeof s.label === "string" && typeof s.value === "string"
      ? [{ label: s.label, value: s.value }]
      : [],
  );
}

function toCard(p: Prisma.ProductGetPayload<{ include: { variants: true; category: true } }>) {
  const prices = p.variants.map((v) => v.priceCents);
  return {
    slug: p.slug,
    name: p.name,
    image: p.images[0] ?? null,
    origin: p.origin,
    fromCents: prices.length ? Math.min(...prices) : 0,
    categoryName: p.category?.name ?? null,
  };
}

export async function getFeaturedProducts(limit = 4) {
  const products = await prisma.product.findMany({
    where: { active: true, featured: true },
    include: { variants: true, category: true },
    // Ordine di vetrina deciso nel seed; createdAt solo come spareggio stabile.
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    take: limit,
  });
  return products.map(toCard);
}

/**
 * Prezzo della confezione di riferimento per gli esempi del piano provvigionale:
 * la più economica tra quelle che valgono 1 unità. È anche il caso peggiore per
 * la percentuale distribuita, quindi è quello giusto per confrontarla col tetto.
 * Letto dal catalogo perché nessuna pagina riporti un prezzo scritto a mano.
 */
export async function getReferencePackCents() {
  const cheapest = await prisma.productVariant.findFirst({
    where: { commissionUnits: 1, product: { active: true } },
    orderBy: { priceCents: "asc" },
    select: { priceCents: true },
  });
  return cheapest?.priceCents ?? null;
}

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { position: "asc" } });
}

export async function getProducts(opts: { categorySlug?: string; roast?: string; q?: string }) {
  const where: Prisma.ProductWhereInput = { active: true };
  if (opts.categorySlug) where.category = { slug: opts.categorySlug };
  if (opts.roast) where.roastLevel = opts.roast as Prisma.ProductWhereInput["roastLevel"];
  if (opts.q)
    where.OR = [
      { name: { contains: opts.q, mode: "insensitive" } },
      { description: { contains: opts.q, mode: "insensitive" } },
    ];

  const products = await prisma.product.findMany({
    where,
    include: { variants: true, category: true },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });
  return products.map(toCard);
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    // Il prezzo da solo non basta: le cialde 44 e 38 mm costano uguale e Postgres non
    // garantisce l'ordine a parità di chiave, quindi il formato preselezionato (e la sua
    // foto) cambierebbe a caso tra un caricamento e l'altro. A parità di prezzo vale
    // l'ordine di creazione: i cuid crescono nel tempo, il primo è quello del seed.
    include: { variants: { orderBy: [{ priceCents: "asc" }, { id: "asc" }] }, category: true },
  });
}
