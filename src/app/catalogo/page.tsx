import Link from "next/link";
import { SearchX } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/ui/reveal";
import { EmptyState } from "@/components/ui/empty-state";
import { getProducts, getCategories } from "@/server/catalog";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Catalogo" };

type SearchParams = Promise<{ categoria?: string; tostatura?: string; q?: string }>;

const ROASTS = [
  { value: "LIGHT", label: "Chiara" },
  { value: "MEDIUM", label: "Media" },
  { value: "DARK", label: "Scura" },
];

export default async function CatalogoPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const [products, categories] = await Promise.all([
    getProducts({ categorySlug: sp.categoria, roast: sp.tostatura, q: sp.q }),
    getCategories(),
  ]);

  const buildHref = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { categoria: sp.categoria, tostatura: sp.tostatura, q: sp.q, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const qs = params.toString();
    return qs ? `/catalogo?${qs}` : "/catalogo";
  };

  const hasFilters = Boolean(sp.categoria || sp.tostatura || sp.q);

  return (
    <div className="container-page py-12">
      <h1 className="font-heading text-4xl font-bold tracking-tight text-coffee-900">Catalogo</h1>
      <p className="mt-2 text-lg text-coffee-600">Il nostro caffè, selezionato per te.</p>

      {/* Filtri */}
      <div className="mt-8 flex flex-wrap items-center gap-2">
        <FilterChip href={buildHref({ categoria: undefined })} active={!sp.categoria}>
          Tutte
        </FilterChip>
        {categories.map((c) => (
          <FilterChip
            key={c.id}
            href={buildHref({ categoria: c.slug })}
            active={sp.categoria === c.slug}
          >
            {c.name}
          </FilterChip>
        ))}

        <span className="mx-2 hidden h-6 w-px bg-coffee-200 sm:block" />

        {/* Le tostature sono toggle: il segno "×" lo rende evidente */}
        {ROASTS.map((r) => {
          const active = sp.tostatura === r.value;
          return (
            <FilterChip
              key={r.value}
              href={buildHref({ tostatura: active ? undefined : r.value })}
              active={active}
            >
              {r.label}
              {active && <span className="ml-1.5 opacity-70">×</span>}
            </FilterChip>
          );
        })}
      </div>

      {/* Conteggio risultati: dà riscontro immediato al filtro applicato */}
      <div className="mt-6 flex items-center justify-between gap-4 border-b border-coffee-100 pb-4">
        <p className="text-sm text-coffee-500">
          {products.length === 0
            ? "Nessun risultato"
            : `${products.length} ${products.length === 1 ? "prodotto" : "prodotti"}`}
        </p>
        {hasFilters && (
          <Link
            href="/catalogo"
            className="text-sm font-medium text-accent-dark transition-colors hover:text-accent"
          >
            Rimuovi i filtri
          </Link>
        )}
      </div>

      {products.length === 0 ? (
        <EmptyState
          className="mt-10"
          icon={<SearchX className="h-7 w-7" />}
          title="Nessun prodotto trovato"
          description="Nessun caffè corrisponde a questa combinazione di filtri. Prova ad allargare la ricerca."
          action={{ label: "Vedi tutto il catalogo", href: "/catalogo" }}
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

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
        active
          ? "bg-coffee-800 text-cream shadow-(--shadow-soft)"
          : "border border-coffee-200 bg-white text-coffee-700 hover:-translate-y-0.5 hover:border-coffee-300 hover:bg-coffee-50 hover:text-coffee-900",
      )}
    >
      {children}
    </Link>
  );
}
