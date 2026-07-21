import { Skeleton, ProductGridSkeleton } from "@/components/ui/skeleton";

export default function CatalogoLoading() {
  return (
    <div className="container-page py-10">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="mt-3 h-5 w-72" />
      <div className="mt-8 flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>
      <div className="mt-8">
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
