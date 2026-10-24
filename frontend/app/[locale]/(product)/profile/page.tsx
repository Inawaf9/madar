// User-specific content renders after client-side development identity loading.
export const instant = false;
import { Suspense } from "react";
import { ProfilePage } from "@/features/product/profile";
import { ProfileSkeleton } from "@/components/product/page-skeleton";
export default function Page() { return <Suspense fallback={<ProfileSkeleton />}><ProfilePage /></Suspense>; }
