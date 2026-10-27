import { Skeleton } from "@/components/ui/skeleton";
import { LoadingStatus } from "@/components/shared/loading-status";
import { HeadingSkeleton, FormPanelSkeleton } from "@/components/shared/page-skeleton";

export function AuthSkeleton({ register = false }: { register?: boolean }) {
  return (
    <section className="mx-auto grid max-w-5xl items-start gap-10 py-12 sm:py-20 lg:grid-cols-2">
      <div>
        <HeadingSkeleton />
        <LoadingStatus label="نحمّل صفحة الحساب">
          <Skeleton className="h-52 w-full rounded-3xl" />
        </LoadingStatus>
      </div>
      <FormPanelSkeleton fields={register ? 3 : 0} />
    </section>
  );
}
