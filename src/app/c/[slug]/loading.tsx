import { Skeleton, ProductCardSkeleton } from "@/components/ui/skeleton";

/**
 * Ricalca l'impaginazione reale (hero scuro + griglia a 3) così il passaggio
 * al contenuto non fa saltare il layout.
 */
export default function MiniSiteLoading() {
  return (
    <>
      <section className="bg-coffee-950">
        <div className="container-page py-24">
          <div className="mx-auto flex max-w-2xl flex-col items-center">
            <Skeleton className="h-20 w-20 rounded-full opacity-20" />
            <Skeleton className="mt-7 h-4 w-56 opacity-20" />
            <Skeleton className="mt-4 h-12 w-80 max-w-full opacity-20" />
            <Skeleton className="mt-6 h-5 w-64 max-w-full opacity-20" />
            <div className="mt-10 flex gap-3">
              <Skeleton className="h-12 w-44 rounded-full opacity-20" />
              <Skeleton className="h-12 w-36 rounded-full opacity-20" />
            </div>
          </div>
        </div>
      </section>

      <div className="container-page py-20">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </>
  );
}
