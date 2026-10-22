import { Suspense } from "react";
import { PropertySearchPage } from "@/features/properties/search-page";
import { SearchSkeleton } from "@/features/properties/skeletons";
export default function Page() { return <Suspense fallback={<SearchSkeleton />}><PropertySearchPage /></Suspense>; }
