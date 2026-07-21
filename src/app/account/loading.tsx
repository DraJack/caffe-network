import { Skeleton } from "@/components/ui/skeleton";

export default function AccountLoading() {
  return (
    <div className="container-page py-10">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="mt-3 h-5 w-48" />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="mt-8 h-64 rounded-2xl" />
    </div>
  );
}
