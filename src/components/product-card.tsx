import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatEuro } from "@/lib/utils";
import { Badge } from "@/components/ui/card";
import { ProductImage } from "@/components/ui/product-image";

type Props = {
  slug: string;
  name: string;
  image: string | null;
  origin?: string | null;
  fromCents: number;
  /** true se le varianti hanno prezzi diversi: solo allora si scrive «da». */
  priceVaries?: boolean;
  categoryName?: string | null;
};

export function ProductCard({
  slug,
  name,
  image,
  origin,
  fromCents,
  priceVaries = false,
  categoryName,
}: Props) {
  return (
    <Link
      href={`/prodotto/${slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-coffee-100 bg-white shadow-(--shadow-card) transition-all duration-300 ease-out-quart hover:-translate-y-1 hover:border-coffee-200 hover:shadow-(--shadow-lift)"
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-coffee-100">
        <ProductImage
          src={image}
          alt={name}
          className="transition-transform duration-500 ease-out-quart group-hover:scale-105"
        />
        {/* Velo caldo in hover: dà profondità senza spegnere il prodotto */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-coffee-950/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        {categoryName && <Badge className="w-fit">{categoryName}</Badge>}
        <h3 className="mt-1 font-heading text-base font-semibold leading-snug text-coffee-900 transition-colors group-hover:text-accent-dark">
          {name}
        </h3>
        {origin && <p className="whitespace-pre-line text-sm text-coffee-500">{origin}</p>}
        <p className="mt-auto pt-3 text-coffee-800">
          {priceVaries && <span className="text-xs text-coffee-500">da </span>}
          <span className="font-heading text-lg font-semibold">{formatEuro(fromCents)}</span>
        </p>
        {/* Invito all'azione: su mobile non c'è hover, senza questo la card non
            sembra cliccabile. È uno <span>, non un <button>: l'intera card è già
            il link, e un elemento interattivo dentro un <a> non è HTML valido.
            La freccia dice "si va alla pagina", non "aggiunto al carrello". */}
        <span
          aria-hidden
          className="mt-3 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-md bg-coffee-900 text-sm font-semibold tracking-wide text-cream transition-colors duration-200 group-hover:[background-image:var(--gold-gradient)] group-hover:text-coffee-950"
        >
          Acquista
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
