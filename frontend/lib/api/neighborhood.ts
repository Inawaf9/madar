import { apiRequest, apiGet as get } from "./client";
import type { PlacesResponse, NearbyPlace, Neighborhood, EssentialResult } from "./discovery-contracts";
import type { ApiResponse } from "./contracts";
export const neighborhood = {
  confirm: (id: number) => apiRequest<ApiResponse>(`/api/v1/current-home/${id}/confirm-move`, { method: "POST" }),
  overview: (id: number, signal?: AbortSignal) => get<Neighborhood>(`/api/v1/current-home/${id}/neighborhood`, {}, signal),
  category: (id: number, category: string, radius: number, signal?: AbortSignal) => get<PlacesResponse>(`/api/v1/current-home/${id}/nearby-by-category`, { category, radius }, signal),
  essentials: (id: number, radius: number, signal?: AbortSignal) => get<EssentialResult[]>(`/api/v1/current-home/${id}/nearest-essential`, { radius }, signal),
  search: (id: number, query: string, radius: number, signal?: AbortSignal) => get<NearbyPlace[]>(`/api/v1/current-home/${id}/nearby-search`, { query, radius }, signal),
};
