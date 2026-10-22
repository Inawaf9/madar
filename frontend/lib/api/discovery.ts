import { apiRequest } from "./client";
import { ApiError } from "./errors";
import { serializeQuery, type SearchFilters, type SearchResponse, type Property, type Interest, type InterestInput, type PlacesResponse, type NearbyPlace, type Neighborhood, type EssentialResult, type CommuteReport, type Checkout, type Payment, type FeatureAccess, type MatchSummary, type PriceStats } from "./discovery-contracts";
import type { ApiResponse } from "./contracts";
const enc = encodeURIComponent;
const get = <T>(path: string, params: object = {}, signal?: AbortSignal) => apiRequest<T>(`${path}${Object.keys(params).length ? `?${serializeQuery(params)}` : ""}`, { signal });
export const discovery = {
  search: async (filters: SearchFilters, signal?: AbortSignal) => {
    const page = await get<SearchResponse>("/api/v1/properties/search", filters, signal);
    if (!page || !Array.isArray(page.data) || page.data.some(p => !p) || !page.pagination || !Number.isInteger(page.pagination.limit) || page.pagination.limit < 1 || (page.pagination.nextCursor !== null && typeof page.pagination.nextCursor !== "string") || typeof page.pagination.hasMore !== "boolean" || typeof page.pagination.resultWindowReached !== "boolean" || (page.pagination.hasMore && !page.pagination.resultWindowReached && !page.pagination.nextCursor)) throw new ApiError("Invalid provider response", 502);
    return page;
  },
  detail: async (source: string, id: string, signal?: AbortSignal) => {
    const property = await get<Property>(`/api/v1/properties/get/${enc(source)}/${enc(id)}`, {}, signal);
    if (!property || typeof property.source !== "string" || (property.externalId !== null && typeof property.externalId !== "string")) throw new ApiError("Invalid listing response", 502);
    return property;
  },
  similar: (source: string, id: string, signal?: AbortSignal) => get<Property[]>(`/api/v1/properties/similar/${enc(source)}/${enc(id)}`, {}, signal),
  personalized: (kind: "by-preferences" | "within-budget", id: number, signal?: AbortSignal) => get<Property[]>(`/api/v1/properties/${kind}/${id}`, {}, signal),
  underBudget: (id: number, margin: number, signal?: AbortSignal) => get<Property[]>(`/api/v1/properties/under-budget-margin/${id}/${margin}`, {}, signal),
  match: (id: number, signal?: AbortSignal) => get<MatchSummary>(`/api/v1/housing-preference/match-summary/${id}`, {}, signal),
  stats: (city: string, purpose: string, type: string, signal?: AbortSignal) => get<PriceStats>(`/api/v1/properties/price-stats/${enc(city)}/${enc(purpose)}/${enc(type)}`, {}, signal),
  nearby: (latitude: number, longitude: number, placeType: string, radiusMeters: number, signal?: AbortSignal) => get<PlacesResponse>("/api/v1/place-preference/nearby-services", { latitude, longitude, placeType, radiusMeters }, signal),
};
export const interests = {
  get: (id: number, signal?: AbortSignal) => get<Interest[]>(`/api/v1/essential-interest/get/${id}`, {}, signal),
  add: (id: number, body: InterestInput) => apiRequest<ApiResponse>(`/api/v1/essential-interest/add/${id}`, { method: "POST", body }),
  update: (id: number, interestId: number, body: InterestInput) => apiRequest<ApiResponse>(`/api/v1/essential-interest/update/${id}/${interestId}`, { method: "PUT", body }),
  remove: (id: number, interestId: number) => apiRequest<ApiResponse>(`/api/v1/essential-interest/delete/${id}/${interestId}`, { method: "DELETE" }),
};
export const neighborhood = {
  confirm: (id: number) => apiRequest<ApiResponse>(`/api/v1/current-home/${id}/confirm-move`, { method: "POST" }),
  overview: (id: number, signal?: AbortSignal) => get<Neighborhood>(`/api/v1/current-home/${id}/neighborhood`, {}, signal),
  category: (id: number, category: string, radius: number, signal?: AbortSignal) => get<PlacesResponse>(`/api/v1/current-home/${id}/nearby-by-category`, { category, radius }, signal),
  essentials: (id: number, radius: number, signal?: AbortSignal) => get<EssentialResult[]>(`/api/v1/current-home/${id}/nearest-essential`, { radius }, signal),
  search: (id: number, query: string, radius: number, signal?: AbortSignal) => get<NearbyPlace[]>(`/api/v1/current-home/${id}/nearby-search`, { query, radius }, signal),
};
export const payments = {
  access: (id: number, signal?: AbortSignal) => get<FeatureAccess>(`/api/v1/payments/${id}/access/COMMUTE_REPORT`, {}, signal),
  checkout: (id: number, key: string) => apiRequest<Checkout>(`/api/v1/payments/${id}/checkout`, { method: "POST", headers: { "Idempotency-Key": key }, body: { serviceType: "COMMUTE_REPORT" } }),
  verify: (id: number, paymentId: number, signal?: AbortSignal) => get<Payment>(`/api/v1/payments/${id}/${paymentId}/verify`, {}, signal),
  history: (id: number, status?: string, signal?: AbortSignal) => get<Payment[]>(`/api/v1/payments/${id}`, { status }, signal),
  commute: (id: number, latitude: number, longitude: number, signal?: AbortSignal) => get<CommuteReport>(`/api/v1/place-preference/calculate-commutes/${id}`, { latitude, longitude }, signal),
};
