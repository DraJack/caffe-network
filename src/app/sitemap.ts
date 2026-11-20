import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Letta a richiesta: niente accesso al DB durante il build.
export const dynamic = "force-dynamic";

/** Pagine pubbliche indicizzabili. Le vetrine /c/ restano fuori (noindex). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await prisma.product.findMany({
    where: { active: true },
    select: { slug: true, updatedAt: true },
    orderBy: { position: "asc" },
  });

  const pages = ["", "/catalogo", "/consulenti", "/chi-siamo", "/spedizioni", "/legal"];
  return [
    ...pages.map((p) => ({ url: `${BASE}${p}`, changeFrequency: "weekly" as const })),
    ...products.map((p) => ({
      url: `${BASE}/prodotto/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
    })),
  ];
}
