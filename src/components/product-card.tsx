import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { blendName, machineLabel, parsePack } from "@/lib/product";
import { ProductImage } from "@/components/ui/product-image";

type Props = {
  slug: string;
  name: string;
  image: string | null;
  /** Nome variante del formato preselezionato, es. "100 capsule". */
  packName?: string | null;
  categoryName?: string | null;
};

/**
 * Card di catalogo (anche homepage e mini-siti). Il titolo è la macchina compatibile,
 * sotto c'è il nome della miscela.
 *
 * ⚠️ Niente prezzo, per scelta commerciale: si scopre solo nella pagina prodotto.
 * `toCard()` in `src/server/catalog.ts` non lo espone nemmeno, così non può
 * ricomparire per distrazione.
 */
export function ProductCard({ slug, name, image, packName, categoryName }: Props) {
  const pack = packName ? parsePack(packName) : null;
  const eyebrow = [categoryName, pack && `${pack.count} pz`].filter(Boolean).join(" · ");
  const blend = blendName(name);

  return (
    <Link
      href={`/prodotto/${slug}`}
      aria-label={name}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-coffee-100 bg-white shadow-(--shadow-soft) transition-all duration-300 ease-out-quart hover:-translate-y-1 hover:border-accent/50 hover:shadow-(--shadow-lift) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-coffee-100">
        <ProductImage
          src={image}
          alt=""
          className="transition-transform duration-700 ease-out-quart group-hover:scale-[1.04]"
        />
        {/* Filo dorato che si allarga in hover: lega la foto al corpo della card */}
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-gold transition-transform duration-500 ease-out-quart group-hover:scale-x-100"
        />
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {eyebrow && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-dark sm:text-[11px]">
            {eyebrow}
          </p>
        )}
        <h3 className="mt-1.5 font-heading text-lg font-semibold leading-snug text-coffee-900 sm:text-xl">
          {machineLabel(name)}
        </h3>
        {blend && (
          <p className="mt-1 text-xs text-coffee-500 sm:text-sm">
            Miscela <span className="font-medium text-coffee-700">{blend}</span>
          </p>
        )}

        {/* Invito all'azione: su mobile non c'è hover, senza questo la card non
            sembra cliccabile. È uno <span>, non un <button>: l'intera card è già
            il link, e un elemento interattivo dentro un <a> non è HTML valido. */}
        <div className="mt-auto pt-5">
          <span
            aria-hidden
            className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-coffee-900 text-sm font-semibold tracking-wide text-cream transition-all duration-300 group-hover:[background-image:var(--gold-gradient)] group-hover:text-coffee-950 group-hover:shadow-(--shadow-accent)"
          >
            Acquista
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}
