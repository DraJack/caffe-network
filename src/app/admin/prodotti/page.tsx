import { prisma } from "@/lib/prisma";
import { ProductFlags, VariantEditor } from "@/components/admin/product-controls";

export const metadata = { title: "Admin · Prodotti" };

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: { variants: { orderBy: { priceCents: "asc" } }, category: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-coffee-900">Prodotti</h1>
        <span className="text-sm text-coffee-500">{products.length} prodotti</span>
      </div>

      <div className="mt-6 space-y-4">
        {products.map((p) => (
          <div key={p.id} className="rounded-2xl border border-coffee-100 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-coffee-900">{p.name}</h3>
                <p className="text-sm text-coffee-500">{p.category?.name ?? "Senza categoria"}</p>
              </div>
              <ProductFlags productId={p.id} active={p.active} featured={p.featured} />
            </div>
            <div className="mt-4 space-y-2 border-t border-coffee-100 pt-4">
              {p.variants.map((v) => (
                <VariantEditor
                  key={v.id}
                  variantId={v.id}
                  name={v.name}
                  priceCents={v.priceCents}
                  stock={v.stock}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-sm text-coffee-500">
        Nota: la creazione di nuovi prodotti/varianti e l&apos;upload immagini arriveranno nella
        prossima iterazione. Per ora popola il catalogo con{" "}
        <code className="rounded bg-coffee-100 px-1.5 py-0.5">npm run db:seed</code>.
      </p>
    </div>
  );
}
