import { MadarLoader } from "@/components/branding/madar-loader";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { LoadingStatus } from "./loading-status";

export function HeadingSkeleton() {
  return (
    <LoadingStatus
      label="جارٍ تحميل الصفحة"
      className="mb-6"
    >
      <div className="flex min-w-0 items-center gap-3">
        <MadarLoader
          decorative
          size="sm"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className="h-8 w-4/5 max-w-lg sm:h-9" />
          <Skeleton className="h-5 w-full max-w-xl" />
        </div>
      </div>
    </LoadingStatus>
  );
}

export function FormPanelSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <LoadingStatus label="جارٍ تحميل البيانات والنموذج">
      <div className="@container/form-panel flex flex-col gap-5 rounded-2xl border border-border/70 bg-card p-5">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-5/6" />
        {fields ? (
          <div className="grid gap-4 @min-[26rem]/form-panel:grid-cols-2">
            {Array.from({ length: fields }, (_, i) => (
              <div
                key={i}
                className="flex flex-col gap-2"
              >
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : null}
        <Skeleton className="h-12 w-32 rounded-xl" />
      </div>
    </LoadingStatus>
  );
}

export function MapSkeleton({ className }: { className?: string }) {
  return (
    <LoadingStatus label="جارٍ تحميل المواقع">
      <Skeleton className={cn("w-full rounded-2xl", className || "h-80 sm:h-96")} />
    </LoadingStatus>
  );
}

export function SummaryPanelSkeleton() {
  return (
    <LoadingStatus label="جارٍ تحميل ملخص الإعدادات">
      <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-11 w-28 rounded-xl" />
      </div>
    </LoadingStatus>
  );
}

export function ListSkeleton({
  kind = "places",
}: {
  kind?: "places" | "interests" | "services";
}) {
  return (
    <LoadingStatus label="جارٍ تحميل القائمة">
      <div className="flex flex-col gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-5"
          >
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-4/5" />
            {kind === "places" ? (
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : null}
            {kind !== "services" ? (
              <div className="flex gap-2">
                <Skeleton className="h-11 w-24 rounded-xl" />
                <Skeleton className="size-11 rounded-xl" />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </LoadingStatus>
  );
}

export function SummarySkeleton() {
  return (
    <LoadingStatus label="جارٍ تحميل الملخص">
      <div className="flex flex-wrap gap-3 rounded-2xl border bg-card p-5">
        {[0, 1, 2].map((i) => (
          <Skeleton
            key={i}
            className="h-6 w-32"
          />
        ))}
      </div>
    </LoadingStatus>
  );
}
