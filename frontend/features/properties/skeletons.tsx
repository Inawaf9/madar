import { PropertyCardPlaceholder } from "@/features/properties/property-card-view";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingStatus } from "@/components/shared/loading-status";
import {
  HeadingSkeleton,
  FormPanelSkeleton,
  MapSkeleton,
} from "@/components/shared/page-skeleton";
import { cn } from "@/lib/utils";

export function PropertyCardSkeleton({
  appearance = "default",
}: { appearance?: "default" | "image" } = {}) {
  // Both legacy appearances now share the same image-first card geometry.
  return <PropertyCardPlaceholder key={appearance} />;
}
export function PropertyGridSkeleton({
  count = 6,
  className,
  appearance = "default",
}: {
  count?: number;
  className?: string;
  appearance?: "default" | "image";
}) {
  return (
    <LoadingStatus label="جارٍ تحميل البيوت">
      <div
        className={cn(
          "grid sm:grid-cols-2 lg:grid-cols-3",
          appearance === "image" ? "grid-cols-1 gap-5 sm:gap-6" : "gap-5",
          className,
        )}
      >
        {Array.from({ length: count }, (_, i) => (
          <PropertyCardSkeleton
            key={i}
            appearance={appearance}
          />
        ))}
      </div>
    </LoadingStatus>
  );
}
export function SearchSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <HeadingSkeleton />
      <LoadingStatus label="جارٍ تحميل أدوات البحث">
        <div className="flex min-w-0 flex-col gap-5 rounded-3xl border bg-card p-4 shadow-stone sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="flex flex-col gap-2"
              >
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-11 w-full rounded-xl" />
                <Skeleton className="h-3 w-5/6" />
              </div>
            ))}
          </div>
          <div className="grid gap-4 border-t pt-5 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex flex-col gap-2"
              >
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
            <Skeleton className="h-11 w-full rounded-xl sm:w-36" />
          </div>
          <Skeleton className="h-3 w-2/3" />
          <div className="flex items-center justify-between border-t py-3">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="size-4" />
          </div>
          <div className="flex justify-end border-t pt-3">
            <Skeleton className="h-8 w-32 rounded-xl" />
          </div>
        </div>
      </LoadingStatus>
      <LoadingStatus label="جارٍ تحميل عنوان النتائج">
        <Skeleton className="h-7 w-32" />
      </LoadingStatus>
      <PropertyGridSkeleton
        appearance="image"
        count={6}
      />
      <LoadingStatus label="جارٍ تحميل حالة النتائج">
        <Skeleton className="mx-auto h-12 w-40 rounded-xl" />
      </LoadingStatus>
    </div>
  );
}
export function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <HeadingSkeleton />
      <LoadingStatus label="جارٍ تحميل تفاصيل البيت">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1fr)]">
          <div className="order-2 flex flex-col gap-5 rounded-3xl border bg-card p-5 shadow-stone sm:p-6 lg:order-1">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-4/5" />
            <div className="grid grid-cols-2 gap-4 border-y py-5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex flex-col gap-2"
                >
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
            <Skeleton className="h-4 w-24" />
            <div className="flex flex-col gap-3">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton
                  key={i}
                  className="h-4 w-full"
                />
              ))}
            </div>
            <div className="flex flex-col gap-3 border-t pt-5">
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-2/3 rounded-xl" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
          <div className="order-1 flex flex-col gap-3 lg:order-2">
            <Skeleton className="aspect-[4/3] w-full rounded-3xl" />
            <div className="flex justify-center gap-2 py-3">
              {[0, 1, 2].map((i) => (
                <Skeleton
                  key={i}
                  className="size-2 rounded-full"
                />
              ))}
            </div>
          </div>
        </div>
      </LoadingStatus>
      <LoadingStatus label="جارٍ تحميل قسم الموقع">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </LoadingStatus>
      <MapSkeleton />
      <LoadingStatus label="جارٍ تحميل تصنيفات الخدمات">
        <div className="flex flex-col gap-4 border-t pt-6">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-3 w-3/4" />
          <div className="flex gap-2 overflow-hidden">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton
                key={i}
                className="h-8 w-24 shrink-0 rounded-full"
              />
            ))}
          </div>
        </div>
      </LoadingStatus>
    </div>
  );
}
export function SavedDetailSkeleton() {
  return (
    <>
      <HeadingSkeleton />
      <div className="mb-8 max-w-3xl">
        <FormPanelSkeleton fields={0} />
      </div>
      <DetailSkeleton />
    </>
  );
}
