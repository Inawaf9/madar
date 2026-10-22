// User-specific content renders after client-side development identity loading.
export const instant = false;
import { Suspense } from "react";
import { ComparisonsPage } from "@/features/product/comparisons";
import { Loading } from "@/features/product/shared";
export default function Page() { return <Suspense fallback={<Loading />}><ComparisonsPage /></Suspense>; }
