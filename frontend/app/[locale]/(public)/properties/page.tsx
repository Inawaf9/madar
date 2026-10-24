import { Suspense } from "react";
import { PropertySearchPage } from "@/features/properties/search-page";
import { LocationPrefetch } from "@/features/properties/location-prefetch";
import { SearchSkeleton } from "@/features/properties/skeletons";
async function SearchContent({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  return <LocationPrefetch city={typeof params.city === "string" ? params.city : undefined}><PropertySearchPage /></LocationPrefetch>;
}
export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <Suspense fallback={<SearchSkeleton />}><SearchContent searchParams={searchParams} /></Suspense>;
}
