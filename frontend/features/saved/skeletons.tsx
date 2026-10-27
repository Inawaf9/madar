import { PropertyCardPlaceholder } from "@/features/properties/property-card-view";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingStatus } from "@/components/shared/loading-status";
import { HeadingSkeleton } from "@/components/shared/page-skeleton";
import { cn } from "@/lib/utils";

export function SavedCardsSkeleton({ className }: { className?: string }) {
  return (
    <LoadingStatus label="جارٍ تحميل العقارات المحفوظة">
      <div className="@container/saved-skeleton">
        <div
          className={cn(
            "grid auto-rows-fr gap-5 @min-[38rem]/saved-skeleton:grid-cols-2",
            className,
          )}
        >
          {[0, 1].map((i) => (
            <PropertyCardPlaceholder key={i} />
          ))}
        </div>
      </div>
    </LoadingStatus>
  );
}

export function SavedPageSkeleton() {
  return (
    <>
      <HeadingSkeleton />
      <Skeleton className="mb-5 h-11 w-full max-w-sm rounded-xl" />
      <SavedCardsSkeleton />
    </>
  );
}
