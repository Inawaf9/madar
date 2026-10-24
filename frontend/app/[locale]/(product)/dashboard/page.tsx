// User-specific content renders after client-side development identity loading.
export const instant = false;
import { Suspense } from "react";
import { DashboardPage } from "@/features/product/dashboard";
import { DashboardSkeleton } from "@/components/product/page-skeleton";
export default function Page() { return <Suspense fallback={<DashboardSkeleton />}><DashboardPage /></Suspense>; }
