// User-specific content renders after client-side development identity loading.
export const instant = false;
import { Suspense } from "react";
import { ComparisonsPage } from "@/features/product/comparisons";
import { ComparisonSkeleton } from "@/components/product/page-skeleton";
export default function Page() { return <Suspense fallback={<ComparisonSkeleton />}><ComparisonsPage /></Suspense>; }
