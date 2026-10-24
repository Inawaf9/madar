"use client";
import { useHydrated } from "@/hooks/use-hydrated";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { locationCatalogOptions, locationNeighborhoodKey } from "@/lib/api/location-query-options";
import { locations, isSearchNeighborhoodId } from "@/lib/api/locations";
import { ApiError } from "@/lib/api/errors";

const catalogOptions = { staleTime: 10 * 60_000, gcTime: 30 * 60_000, retry: false, retryOnMount: false, refetchOnWindowFocus: false, refetchOnReconnect: false } as const;

export function useCities() {
  const query = useQuery(locationCatalogOptions());
  // A streamed query may resolve before the browser hydrates this subtree.
  // Readiness must match the server snapshot even when the client cache is warm.
  const hydrated = useHydrated();
  return { ...query, hydrated };
}

/** Shared keys coalesce page/form subscriptions; no prior-city placeholder data. */
export function useLocationSelection(cityValue: string, neighborhoodValue = "") {
  const cities = useCities();
  const city = cities.hydrated ? cities.data?.find(item => item.slug === cityValue) : undefined;
  const neighborhoods = useQuery({
    queryKey: locationNeighborhoodKey(city?.slug || ""),
    queryFn: ({ signal }) => locations.neighborhoods(city!.slug, signal),
    enabled: !!city, ...catalogOptions,
  });
  const neighborhood = neighborhoods.data?.find(item => String(item.id) === neighborhoodValue && isSearchNeighborhoodId(neighborhoodValue));
  return {
    cities, neighborhoods, city, neighborhood,
    pending: !cities.hydrated || cities.isPending || !!city && !!neighborhoodValue && neighborhoods.isPending,
    ready: !!city && (!neighborhoodValue || !!neighborhood),
  };
}

/** Explicit retries only, with a shared error timestamp imposing a 15s 429 cooldown. */
export function useCatalogRetry(query: { error: unknown; errorUpdatedAt: number; isFetching: boolean; refetch: () => Promise<unknown> }) {
  const [unlockedError, setUnlockedError] = useState(0);
  const rateLimited = query.error instanceof ApiError && query.error.status === 429;
  useEffect(() => {
    if (!rateLimited) return;
    const timer = setTimeout(() => setUnlockedError(query.errorUpdatedAt), Math.max(0, query.errorUpdatedAt + 15_000 - Date.now()));
    return () => clearTimeout(timer);
  }, [rateLimited, query.errorUpdatedAt]);
  const coolingDown = rateLimited && unlockedError !== query.errorUpdatedAt;
  return { disabled: query.isFetching || coolingDown, coolingDown, retry: () => { if (!query.isFetching && !coolingDown) void query.refetch(); } };
}
