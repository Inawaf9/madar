// User-specific content renders after client-side development identity loading.
export const instant = false;
import { Suspense } from "react";
import { SavedPage } from "@/features/product/saved";
import { SavedPageSkeleton } from "@/components/product/page-skeleton";
export default function Page() { return <Suspense fallback={<SavedPageSkeleton />}><SavedPage /></Suspense>; }
