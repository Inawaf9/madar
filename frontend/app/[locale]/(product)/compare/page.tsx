import { requirePageSession } from "@/lib/auth/authorization.server";
// Private content requires a server-side session.
export const instant = false;
import { Suspense } from "react";
import { ComparisonsPage } from "@/features/comparisons/comparisons";
import { ComparisonSkeleton } from "@/features/comparisons/skeletons";
export default async function Page() {
  await requirePageSession();
  return (
    <Suspense fallback={<ComparisonSkeleton />}>
      <ComparisonsPage />
    </Suspense>
  );
}
