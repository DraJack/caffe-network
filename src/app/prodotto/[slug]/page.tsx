import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product-detail";
import { getProductBySlug } from "@/server/catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return { title: product?.name ?? "Prodotto" };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || !product.active || product.variants.length === 0) notFound();

  return (
    <ProductDetail
      name={product.name}
      description={product.description}
      origin={product.origin}
      roast={product.roastLevel}
      image={product.images[0] ?? null}
      categoryName={product.category?.name ?? null}
      variants={product.variants.map((v) => ({
        id: v.id,
        name: v.name,
        priceCents: v.priceCents,
        stock: v.stock,
      }))}
    />
  );
}
