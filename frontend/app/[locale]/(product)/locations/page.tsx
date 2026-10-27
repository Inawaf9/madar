import { requirePageSession } from "@/lib/auth/authorization.server";
// Private content requires a server-side session.
export const instant = false;
import { Suspense } from "react";
import { LocationsPage } from "@/features/daily-life/locations";
import { LocationsSkeleton } from "@/features/account/skeletons";
export default async function Page() {
  await requirePageSession();
  return (
    <Suspense fallback={<LocationsSkeleton />}>
      <LocationsPage />
    </Suspense>
  );
}
