import { SearchX } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { CatalogBlendIntro } from "@/components/catalog-blend-intro";
import { Reveal } from "@/components/ui/reveal";
import { EmptyState } from "@/components/ui/empty-state";
import { getProducts } from "@/server/catalog";

export const dynamic = "force-dynamic";

export const metadata = { title: "Catalogo" };

export default async function CatalogoPage() {
  const products = await getProducts({});

  return (
    <div className="container-page py-12 sm:py-16">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-dark">Catalogo</p>
        <h1 className="mt-2 font-heading text-4xl font-bold tracking-tight text-coffee-900 sm:text-5xl">
          Il tuo espresso, per la tua macchina
        </h1>
        <p className="mt-3 text-base text-coffee-600 sm:text-lg">
          Cialde e capsule compatibili con le macchine più diffuse. Scegli la tua e scopri il
          formato giusto.
        </p>
      </header>

      <CatalogBlendIntro products={products} />

      {products.length === 0 ? (
        <EmptyState
          className="mt-10"
          icon={<SearchX className="h-7 w-7" />}
          title="Nessun prodotto trovato"
          description="Il catalogo è momentaneamente vuoto. Torna a trovarci più tardi."
          action={{ label: "Torna al catalogo", href: "/catalogo" }}
        />
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
          {products.map((p, i) => (
            <Reveal key={p.slug} delay={Math.min(i, 7) * 60} className="h-full">
              <ProductCard {...p} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
