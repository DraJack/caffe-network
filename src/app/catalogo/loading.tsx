import { Skeleton, ProductGridSkeleton } from "@/components/ui/skeleton";

export default function CatalogoLoading() {
  return (
    <div className="container-page py-12 sm:py-16">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-3 h-11 w-full max-w-lg" />
      <Skeleton className="mt-4 h-5 w-full max-w-md" />
      <Skeleton className="mt-8 h-36 w-full rounded-2xl" />
      <div className="mt-10">
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
