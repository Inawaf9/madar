import { apiRequest, apiGet as get } from "./client";
import type {
  PlacesResponse,
  NearbyPlace,
  Neighborhood,
  EssentialResult,
} from "./discovery-contracts";
import type { ApiResponse } from "./contracts";
export const neighborhood = {
  confirm: () =>
    apiRequest<ApiResponse>(`/api/v1/current-home/me/confirm-move`, { method: "POST" }),
  overview: (signal?: AbortSignal) =>
    get<Neighborhood>(`/api/v1/current-home/me/neighborhood`, {}, signal),
  category: (category: string, radius: number, signal?: AbortSignal) =>
    get<PlacesResponse>(
      `/api/v1/current-home/me/nearby-by-category`,
      { category, radius },
      signal,
    ),
  essentials: (radius: number, signal?: AbortSignal) =>
    get<EssentialResult[]>(
      `/api/v1/current-home/me/nearest-essential`,
      { radius },
      signal,
    ),
  search: (query: string, radius: number, signal?: AbortSignal) =>
    get<NearbyPlace[]>(
      `/api/v1/current-home/me/nearby-search`,
      { query, radius },
      signal,
    ),
};
