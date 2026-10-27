import { useLocale } from "next-intl";
import { MadarLoader } from "@/components/branding/madar-loader";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingStatus } from "@/components/shared/loading-status";
import { HeadingSkeleton } from "@/components/shared/page-skeleton";

export function PaymentHistorySkeleton() {
  return (
    <LoadingStatus label="جارٍ تحميل سجل المدفوعات">
      <div className="flex flex-col gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-5"
          >
            <div className="flex w-2/3 flex-col gap-3">
              <Skeleton className="h-6 w-4/5" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-full" />
            </div>
            <Skeleton className="h-11 w-32 rounded-xl" />
          </div>
        ))}
      </div>
    </LoadingStatus>
  );
}

export function PaymentVerificationSkeleton() {
  const ar = useLocale() === "ar";
  return (
    <LoadingStatus
      label={ar ? "نتحقق من حالة الدفع والوصول" : "Checking payment and access"}
    >
      <div className="flex flex-col gap-5 rounded-2xl border bg-card p-5">
        <MadarLoader
          decorative
          size="md"
        />
        <p className="text-sm text-muted-foreground">
          {ar ? "نتحقق من حالة الدفع" : "Checking payment status"}
        </p>
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-11 w-32 rounded-xl" />
      </div>
    </LoadingStatus>
  );
}

export function CommuteAnalysisSkeleton() {
  return (
    <LoadingStatus label="جارٍ حساب التنقل الفعلي">
      <div className="flex flex-col gap-4 rounded-2xl bg-secondary p-4">
        <MadarLoader
          decorative
          size="md"
        />
        <Skeleton className="h-6 w-4/5 bg-background" />
        {[0, 1, 2].map((i) => (
          <Skeleton
            key={i}
            className="h-5 w-2/3 bg-background"
          />
        ))}
        <Skeleton className="h-3 w-full bg-background" />
      </div>
    </LoadingStatus>
  );
}

export function PaymentsSkeleton({ verification = false }: { verification?: boolean }) {
  return (
    <div className="flex flex-col gap-6">
      <HeadingSkeleton />
      {verification ? (
        <PaymentVerificationSkeleton />
      ) : (
        <>
          <Skeleton className="h-11 w-full max-w-xs rounded-xl" />
          <PaymentHistorySkeleton />
        </>
      )}
    </div>
  );
}
