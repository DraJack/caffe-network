import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

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
    take: limit,
  });
  return products.map(toCard);
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
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });
  return products.map(toCard);
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: { variants: { orderBy: { priceCents: "asc" } }, category: true },
  });
}
