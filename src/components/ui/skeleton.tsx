import * as React from "react";
import { cn } from "@/lib/utils";

/** Blocco segnaposto con shimmer caldo. Base di tutti i loading.tsx. */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton rounded-xl", className)} aria-hidden {...props} />;
}

/** Segnaposto di una card prodotto, per le griglie di catalogo. */
export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-coffee-100 bg-white shadow-(--shadow-soft)">
      <Skeleton className="aspect-square rounded-none" />
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="mt-2 h-6 w-20" />
      </div>
    </div>
  );
}

/** Griglia di card prodotto in caricamento. */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
