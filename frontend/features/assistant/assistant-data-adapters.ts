import type { QueryClient } from "@tanstack/react-query";
import type { HousingPreference } from "@/lib/api/contracts";
import { mapHousingToSearch, preferredCity } from "@/features/properties/preference-search";
import { locationCatalogOptions, locationNeighborhoodKey } from "@/lib/api/location-query-options";
import { locations } from "@/lib/api/locations";

/** Map both account and selections preference copies through the same verified contract. */
export async function mapAssistantHousing(cache: QueryClient, housing: Partial<HousingPreference>) {
  const cities = await cache.fetchQuery(locationCatalogOptions()); const city = preferredCity(housing, cities);
  const neighborhoods = city && housing.district ? await cache.fetchQuery({ queryKey: locationNeighborhoodKey(city.slug), queryFn: ({ signal }) => locations.neighborhoods(city.slug, signal), staleTime: 600000, retry: false }) : [];
  return mapHousingToSearch(housing, cities, neighborhoods);
}
