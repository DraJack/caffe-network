import Link from "next/link";
import { formatEuro } from "@/lib/utils";
import { Badge } from "@/components/ui/card";
import { ProductImage } from "@/components/ui/product-image";

type Props = {
  slug: string;
  name: string;
  image: string | null;
  origin?: string | null;
  fromCents: number;
  categoryName?: string | null;
};

export function ProductCard({ slug, name, image, origin, fromCents, categoryName }: Props) {
  return (
    <Link
      href={`/prodotto/${slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-coffee-100 bg-white shadow-(--shadow-card) transition-all duration-300 ease-out-quart hover:-translate-y-1 hover:border-coffee-200 hover:shadow-(--shadow-lift)"
    >
      <div className="relative aspect-square overflow-hidden bg-coffee-100">
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
        {origin && <p className="text-sm text-coffee-500">{origin}</p>}
        <p className="mt-auto pt-3 text-coffee-800">
          <span className="text-xs text-coffee-500">da </span>
          <span className="font-heading text-lg font-semibold">{formatEuro(fromCents)}</span>
        </p>
      </div>
    </Link>
  );
}
