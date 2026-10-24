import { apiGet as get } from "./client";
import { ApiError } from "./errors";

import { type SearchFilters, type SearchResponse, type Property, type PlacesResponse, type MatchSummary, type PriceStats } from "./discovery-contracts";
import type { ApiLanguage } from "./config";

const enc = encodeURIComponent;
export const discovery = {
  search: async (filters: SearchFilters, signal?: AbortSignal) => {
    const page = await get<SearchResponse>("/api/v1/properties/search", filters, signal);
    if (!page || !Array.isArray(page.data) || page.data.some(p => !p) || !page.pagination || !Number.isInteger(page.pagination.limit) || page.pagination.limit < 1 || (page.pagination.nextCursor !== null && typeof page.pagination.nextCursor !== "string") || typeof page.pagination.hasMore !== "boolean" || typeof page.pagination.resultWindowReached !== "boolean" || (page.pagination.hasMore && !page.pagination.resultWindowReached && !page.pagination.nextCursor)) throw new ApiError("Invalid provider response", 502);
    return page;
  },
  detail: async (source: string, id: string, signal?: AbortSignal, lang: ApiLanguage = "ar") => {
    const property = await get<Property>(`/api/v1/properties/get/${enc(source)}/${enc(id)}`, { lang }, signal);
    if (!property || typeof property.source !== "string" || (property.externalId !== null && typeof property.externalId !== "string")) throw new ApiError("Invalid listing response", 502);
    return property;
  },
  similar: (source: string, id: string, signal?: AbortSignal, lang: ApiLanguage = "ar") => get<Property[]>(`/api/v1/properties/similar/${enc(source)}/${enc(id)}`, { lang }, signal),
  personalized: (kind: "by-preference-in-my-district" | "within-budget", id: number, signal?: AbortSignal, lang: ApiLanguage = "ar") => get<Property[]>(`/api/v1/properties/${kind}/${id}`, { lang }, signal),
  underBudget: (id: number, margin: number, signal?: AbortSignal, lang: ApiLanguage = "ar") => get<Property[]>(`/api/v1/properties/under-budget-margin/${id}/${margin}`, { lang }, signal),
  match: (id: number, signal?: AbortSignal) => get<MatchSummary>(`/api/v1/properties/match-summary/${id}`, {}, signal),
  stats: (city: string, purpose: string, type: string, signal?: AbortSignal) => get<PriceStats>(`/api/v1/properties/price-stats/${enc(city)}/${enc(purpose)}/${enc(type)}`, {}, signal),
  nearby: (latitude: number, longitude: number, placeType: string, radiusMeters: number, signal?: AbortSignal) => get<PlacesResponse>("/api/v1/place-preference/nearby-services", { latitude, longitude, placeType, radiusMeters }, signal),
};
