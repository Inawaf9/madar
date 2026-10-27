import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { getLocationCatalog, getCityNeighborhoods } from "@/lib/locations/catalog.server";
import {
  locationCatalogOptions,
  locationNeighborhoodKey,
} from "@/lib/api/location-query-options";
import type { ReactNode } from "react";
import { io } from "next/cache";

/** Hydrate only completed location queries; a rejected pending query cannot be streamed safely. */
export async function LocationPrefetch({
  children,
  city,
}: {
  children: ReactNode;
  city?: string;
}) {
  // TanStack Query reads Date.now() for freshness and hydration timestamps.
  // Keep that bookkeeping outside the static shell while allowing prefetches.
  await io();
  const client = new QueryClient();
  const prefetches: Promise<void>[] = [
    client.prefetchQuery({
      ...locationCatalogOptions(),
      queryFn: () => getLocationCatalog(2),
      gcTime: Infinity,
    }),
  ];
  if (city && /^[a-z_]+$/.test(city)) {
    prefetches.push(
      client.prefetchQuery({
        queryKey: locationNeighborhoodKey(city),
        queryFn: () => getCityNeighborhoods(city),
        staleTime: 10 * 60_000,
        gcTime: Infinity,
        retry: false,
      }),
    );
  }
  // Keep the search shell responsive if the location service is slow or unavailable.
  // Queries still pending at the deadline are omitted from hydration.
  let deadline: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      Promise.all(prefetches),
      new Promise<void>((resolve) => {
        deadline = setTimeout(resolve, 3_000);
      }),
    ]);
  } finally {
    if (deadline) clearTimeout(deadline);
  }
  return (
    <HydrationBoundary
      state={dehydrate(client, {
        shouldDehydrateQuery: (query) => query.state.status === "success",
      })}
    >
      {children}
    </HydrationBoundary>
  );
}
