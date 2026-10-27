import { requirePageSession } from "@/lib/auth/authorization.server";
// Private content requires a server-side session.
export const instant = false;
import { Suspense } from "react";
import { ProfilePage } from "@/features/account/profile";
import { ProfileSkeleton } from "@/features/account/skeletons";
export default async function Page() {
  await requirePageSession();
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfilePage />
    </Suspense>
  );
}
