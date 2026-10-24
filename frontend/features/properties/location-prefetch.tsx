import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { getLocationCatalog, getCityNeighborhoods } from "@/lib/locations/catalog.server";
import { locationCatalogOptions, locationNeighborhoodKey } from "@/lib/api/location-query-options";
import type { ReactNode } from "react";
import { io } from "next/cache";

/** Stream the pending query: the page shell never waits on the location provider. */
export async function LocationPrefetch({ children, city }: { children: ReactNode; city?: string }) {
  // TanStack Query reads Date.now() for freshness and hydration timestamps.
  // Keep that bookkeeping outside the static shell while allowing prefetches.
  await io();
  const client = new QueryClient();
  void client.prefetchQuery({ ...locationCatalogOptions(), queryFn: () => getLocationCatalog(2), gcTime: Infinity });
  if (city && /^[a-z_]+$/.test(city)) void client.prefetchQuery({
    queryKey: locationNeighborhoodKey(city), queryFn: () => getCityNeighborhoods(city),
    staleTime: 10 * 60_000, gcTime: Infinity, retry: false,
  });
  return <HydrationBoundary state={dehydrate(client, {
    shouldDehydrateQuery: query => query.state.status === "success" || query.state.status === "pending",
    shouldRedactErrors: () => true,
  })}>{children}</HydrationBoundary>;
}
