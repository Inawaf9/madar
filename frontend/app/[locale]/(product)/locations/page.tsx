// User-specific content renders after client-side development identity loading.
export const instant = false;
import { Suspense } from "react";
import { LocationsPage } from "@/features/product/locations";
import { Loading } from "@/features/product/shared";
export default function Page() { return <Suspense fallback={<Loading />}><LocationsPage /></Suspense>; }
