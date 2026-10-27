import { Skeleton } from "@/components/ui/skeleton";
import { LoadingStatus } from "@/components/shared/loading-status";
import { HeadingSkeleton, SummaryPanelSkeleton } from "@/components/shared/page-skeleton";

export function ProfileSkeleton() {
  return (
    <>
      <HeadingSkeleton />
      <div className="flex max-w-3xl flex-col gap-6">
        <SummaryPanelSkeleton />
        <Skeleton className="h-12 w-full max-w-sm rounded-xl" />
        <SummaryPanelSkeleton />
      </div>
    </>
  );
}

export function LocationsSkeleton() {
  return (
    <LoadingStatus label="جارٍ تحميل أماكنك المهمة">
      <Skeleton className="mb-5 h-28 rounded-3xl" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] xl:grid-cols-[minmax(0,23fr)_minmax(0,54fr)_minmax(0,23fr)]">
        <Skeleton className="h-72 rounded-3xl" />
        <Skeleton className="h-[520px] rounded-3xl sm:h-[600px] lg:h-[620px]" />
        <Skeleton className="h-80 rounded-3xl lg:col-span-2 xl:col-span-1" />
      </div>
      <Skeleton className="mt-5 h-40 rounded-3xl" />
    </LoadingStatus>
  );
}

export function InterestsSkeleton() {
  return (
    <>
      <HeadingSkeleton />
      <LoadingStatus label="جارٍ تحميل الاهتمامات">
        <div className="flex max-w-5xl flex-col gap-5 rounded-2xl border border-border/70 bg-card p-5">
          <Skeleton className="h-6 w-40" />
          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 9 }, (_, i) => (
              <Skeleton
                key={i}
                className="h-14 w-full rounded-xl"
              />
            ))}
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      </LoadingStatus>
    </>
  );
}
