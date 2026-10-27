import { requirePageSession } from "@/lib/auth/authorization.server";
// Private content requires a server-side session.
export const instant = false;
import { Suspense } from "react";
import { SavedPage } from "@/features/saved/saved";
import { SavedPageSkeleton } from "@/features/saved/skeletons";
export default async function Page() {
  await requirePageSession();
  return (
    <Suspense fallback={<SavedPageSkeleton />}>
      <SavedPage />
    </Suspense>
  );
}
