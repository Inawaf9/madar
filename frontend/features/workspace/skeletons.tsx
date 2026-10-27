import { Skeleton } from "@/components/ui/skeleton";
import { LoadingStatus } from "@/components/shared/loading-status";
import { HeadingSkeleton, SummaryPanelSkeleton } from "@/components/shared/page-skeleton";
import { SavedCardsSkeleton } from "@/features/saved/skeletons";

export function DashboardStatsSkeleton() {
  return (
    <LoadingStatus
      label="جارٍ تحميل ملخص نشاطك"
      className="mb-6"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-start justify-between gap-3 rounded-xl bg-secondary/35 p-4"
          >
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-7 w-12" />
            </div>
            <Skeleton className="size-9 rounded-xl" />
          </div>
        ))}
      </div>
    </LoadingStatus>
  );
}

export function DashboardSkeleton() {
  return (
    <>
      <HeadingSkeleton />
      <DashboardStatsSkeleton />
      <div className="grid items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-7 w-48" />
          <SavedCardsSkeleton />
        </div>
        <div className="flex flex-col gap-4">
          <SummaryPanelSkeleton />
          <SummaryPanelSkeleton />
        </div>
      </div>
    </>
  );
}
