import { SearchX } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/ui/reveal";
import { EmptyState } from "@/components/ui/empty-state";
import { getProducts } from "@/server/catalog";

export const dynamic = "force-dynamic";

export const metadata = { title: "Catalogo" };

export default async function CatalogoPage() {
  const products = await getProducts({});

  return (
    <div className="container-page py-12">
      <h1 className="font-heading text-4xl font-bold tracking-tight text-coffee-900">Catalogo</h1>
      <p className="mt-2 text-lg text-coffee-600">Il nostro caffè, selezionato per te.</p>

      <div className="mt-8 border-b border-coffee-100 pb-4">
        <p className="text-sm text-coffee-500">
          {products.length === 0
            ? "Nessun risultato"
            : `${products.length} ${products.length === 1 ? "prodotto" : "prodotti"}`}
        </p>
      </div>

      {products.length === 0 ? (
        <EmptyState
          className="mt-10"
          icon={<SearchX className="h-7 w-7" />}
          title="Nessun prodotto trovato"
          description="Il catalogo è momentaneamente vuoto. Torna a trovarci più tardi."
          action={{ label: "Torna al catalogo", href: "/catalogo" }}
        />
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {products.map((p, i) => (
            <Reveal key={p.slug} delay={Math.min(i, 7) * 60}>
              <ProductCard {...p} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
