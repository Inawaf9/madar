import { Skeleton } from "@/components/ui/skeleton";
import {
  HeadingSkeleton,
  SummaryPanelSkeleton,
  SummarySkeleton,
  ListSkeleton,
} from "@/components/shared/page-skeleton";

export function NeighborhoodSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <HeadingSkeleton />
      <SummaryPanelSkeleton />
      <Skeleton className="h-12 w-full max-w-sm rounded-xl" />
      <SummarySkeleton />
      <SummaryPanelSkeleton />
      <ListSkeleton kind="services" />
    </div>
  );
}
