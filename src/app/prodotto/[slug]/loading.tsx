import { Skeleton } from "@/components/ui/skeleton";

export default function ProdottoLoading() {
  return (
    <div className="container-page py-10">
      <Skeleton className="h-5 w-32" />
      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <Skeleton className="aspect-square rounded-2xl" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-9 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-11 w-28 rounded-xl" />
            <Skeleton className="h-11 w-28 rounded-xl" />
          </div>
          <Skeleton className="mt-2 h-12 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}
