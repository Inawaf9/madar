// User-specific content renders after client-side development identity loading.
export const instant = false;
import { Suspense } from "react";
import { DashboardPage } from "@/features/product/dashboard";
import { Loading } from "@/features/product/shared";
export default function Page() { return <Suspense fallback={<Loading />}><DashboardPage /></Suspense>; }
