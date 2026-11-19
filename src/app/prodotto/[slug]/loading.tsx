import { Skeleton } from "@/components/ui/skeleton";

export default function ProdottoLoading() {
  return (
    <div className="container-page py-10">
      <Skeleton className="h-5 w-32" />
      <div className="mt-6 grid gap-10 md:grid-cols-2 lg:gap-14">
        <div className="space-y-4 md:self-start">
          <Skeleton className="aspect-[3/2] rounded-3xl" />
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-10 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-28 rounded-full" />
          </div>
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="mt-4 h-80 w-full rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
