import type { HousingPreference } from "@/lib/api/contracts";
import {
  searchKeys,
  searchSchema,
  type SearchFilters,
} from "@/lib/api/discovery-contracts";
import {
  isSearchNeighborhoodId,
  type LocationCity,
  type LocationNeighborhood,
} from "@/lib/api/locations";
import { normalizeLocationName } from "@/lib/locations/normalize-name";

export const searchDefaults = {
  purpose: "rent",
  type: "all",
  sort: "newest",
  limit: "20",
} as const;
export const searchStateKey = "searchState"; // Frontend only; never an API parameter.
export type PreferenceSearchFilters = Partial<
  Pick<SearchFilters, "city" | "neighborhoodId" | "purpose" | "type" | "maxPrice">
>;
export type PreferenceMappingIssue = "city" | "neighborhood" | "budget" | "catalog";

/** Any explicit search key, including an empty value, describes a whole search.
 * Never fill holes in shared links with the recipient's personal preferences. */
export function hasExplicitSearch(params: URLSearchParams) {
  return (
    searchKeys.some((key) => params.has(key)) ||
    params.has(searchStateKey) ||
    params.has("locationDraft")
  );
}
export function preferredCity(
  preference: Partial<HousingPreference>,
  cities: readonly LocationCity[],
) {
  if (typeof preference.city !== "string" || !preference.city.trim()) return undefined;
  const exact = cities.find((city) => city.slug === preference.city);
  if (exact) return exact;
  const name = normalizeLocationName(preference.city);
  const matches = cities.filter((city) =>
    [city.nameAr, city.nameEn].some((value) => normalizeLocationName(value) === name),
  );
  return matches.length === 1 ? matches[0] : undefined;
}
/** Exact provider-catalog matching only. No inferred rooms from occupants,
 * no geographic region filter, and no district name sent as a numeric ID. */
export function mapHousingToSearch(
  preference: Partial<HousingPreference>,
  cities: readonly LocationCity[],
  neighborhoods: readonly LocationNeighborhood[] = [],
) {
  const filters: PreferenceSearchFilters = {};
  const issues: PreferenceMappingIssue[] = [];
  const city = preferredCity(preference, cities);
  if (city) filters.city = city.slug;
  else if (preference.city) issues.push("city");
  if (preference.listingType === "rent" || preference.listingType === "sale")
    filters.purpose = preference.listingType;
  const type = searchSchema.shape.type.safeParse(preference.propertyType);
  if (type.success && type.data) filters.type = type.data;
  // Existing housing UI defines rent budget as annual SAR; public search uses
  // normalized annual rent / total sale prices. Never apply an unknown period.
  if (preference.maxBudget != null) {
    const budget = searchSchema.shape.maxPrice.safeParse(preference.maxBudget);
    if (filters.purpose && budget.success && budget.data != null && budget.data >= 1)
      filters.maxPrice = budget.data;
    else issues.push("budget");
  }
  if (typeof preference.district === "string" && preference.district.trim()) {
    const name = normalizeLocationName(preference.district);
    const matches = city
      ? neighborhoods.filter(
          (item) =>
            [item.nameAr, item.nameEn, item.slug].some(
              (value) => normalizeLocationName(value) === name,
            ) && isSearchNeighborhoodId(String(item.id)),
        )
      : [];
    if (matches.length === 1) filters.neighborhoodId = matches[0].id;
    else issues.push("neighborhood");
  }
  return { filters, issues };
}

/** Snapshot intentional omissions, retaining unrelated tracking/context params. */
export function searchSnapshot(
  current: URLSearchParams,
  filters: PreferenceSearchFilters,
  source: "manual" | "preferences",
  issues: readonly PreferenceMappingIssue[] = [],
) {
  const next = new URLSearchParams(current);
  [...searchKeys, "region", "cityId", "locationDraft", "preferenceNotice"].forEach(
    (key) => next.delete(key),
  );
  Object.entries({ ...searchDefaults, ...filters }).forEach(([key, value]) => {
    if (value != null && value !== "") next.set(key, String(value));
  });
  next.set(searchStateKey, source);
  if (issues.length) next.set("preferenceNotice", [...new Set(issues)].join(","));
  return next;
}
