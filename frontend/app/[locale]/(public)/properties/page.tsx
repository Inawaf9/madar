import { Suspense } from "react";
import { PropertyDiscoveryExperience } from "@/features/search/discovery-experience";
import { LocationPrefetch } from "@/features/locations/location-prefetch";
import { SearchSkeleton } from "@/features/properties/skeletons";
async function SearchContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const queryKeys = Object.keys(params);
  if (!queryKeys.length || (params.mode === "smart" && queryKeys.length === 1)) {
    return <PropertyDiscoveryExperience />;
  }
  return (
    <LocationPrefetch city={typeof params.city === "string" ? params.city : undefined}>
      <PropertyDiscoveryExperience />
    </LocationPrefetch>
  );
}
export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchContent searchParams={searchParams} />
    </Suspense>
  );
}
