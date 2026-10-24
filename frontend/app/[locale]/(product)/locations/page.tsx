// User-specific content renders after client-side development identity loading.
export const instant = false;
import { Suspense } from "react";
import { LocationsPage } from "@/features/product/locations";
import { LocationsSkeleton } from "@/components/product/page-skeleton";
export default function Page() { return <Suspense fallback={<LocationsSkeleton />}><LocationsPage /></Suspense>; }
