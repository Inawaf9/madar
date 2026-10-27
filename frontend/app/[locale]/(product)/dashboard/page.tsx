import { requirePageSession } from "@/lib/auth/authorization.server";
// Private content requires a server-side session.
export const instant = false;
import { Suspense } from "react";
import { DashboardPage } from "@/features/workspace/dashboard";
import { DashboardSkeleton } from "@/features/workspace/skeletons";
export default async function Page() {
  await requirePageSession();
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardPage />
    </Suspense>
  );
}
