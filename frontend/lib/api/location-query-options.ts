import { queryOptions } from "@tanstack/react-query";
import { locations } from "./locations";
export const locationCatalogKey = ["locations", "cities", 2] as const;
export const locationCatalogOptions = () =>
  queryOptions({
    queryKey: locationCatalogKey,
    queryFn: ({ signal }) => locations.catalog(signal),
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
    retry: false,
    retryOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

export const locationNeighborhoodKey = (city: string) =>
  ["locations", "neighborhoods", city] as const;
