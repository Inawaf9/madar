import { Skeleton } from "@/components/ui/skeleton";
import { LoadingStatus } from "@/components/shared/loading-status";
import { HeadingSkeleton, SummaryPanelSkeleton } from "@/components/shared/page-skeleton";

export function ListingSummarySkeleton() {
  return (
    <LoadingStatus label="جارٍ تحميل بيانات الإعلان">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-5/6" />
        <Skeleton className="h-6 w-1/2" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton
              key={i}
              className="h-5 w-4/5"
            />
          ))}
        </div>
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </LoadingStatus>
  );
}

export function ComparisonTableSkeleton() {
  return (
    <LoadingStatus label="جارٍ تحميل المقارنة">
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="grid grid-cols-3 gap-3 bg-muted p-4">
          {[0, 1, 2].map((i) => (
            <Skeleton
              key={i}
              className="h-5 w-full bg-background"
            />
          ))}
        </div>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="grid grid-cols-3 gap-3 border-t p-4"
          >
            {[0, 1, 2].map((j) => (
              <Skeleton
                key={j}
                className="h-5 w-full"
              />
            ))}
          </div>
        ))}
      </div>
    </LoadingStatus>
  );
}

export function ComparisonListSkeleton() {
  return (
    <LoadingStatus label="جارٍ تحميل المقارنات">
      <div className="grid gap-4 xl:grid-cols-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5"
          >
            <Skeleton className="h-5 w-36" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
            <Skeleton className="h-11 w-32 rounded-xl" />
          </div>
        ))}
      </div>
    </LoadingStatus>
  );
}

export function ComparisonSkeleton({ detail = false }: { detail?: boolean }) {
  return (
    <>
      <HeadingSkeleton />
      {detail ? (
        <div className="flex max-w-6xl flex-col gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <SummaryPanelSkeleton />
            <SummaryPanelSkeleton />
          </div>
          <SummaryPanelSkeleton />
        </div>
      ) : (
        <ComparisonListSkeleton />
      )}
    </>
  );
}
