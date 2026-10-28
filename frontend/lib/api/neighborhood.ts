import { apiRequest } from "./client";
import type { PlacesResponse, NearbyPlace, EssentialResult } from "./discovery-contracts";
import type { ApiResponse } from "./contracts";
import { neighborhoodRequestPaths } from "./neighborhood-request-paths";

export const neighborhood = {
  confirm: () =>
    apiRequest<ApiResponse>(`/api/v1/current-home/me/confirm-move`, { method: "POST" }),
  category: (category: string, radius: number, signal?: AbortSignal) =>
    apiRequest<PlacesResponse>(neighborhoodRequestPaths.category(category, radius), {
      signal,
    }),
  essentials: (radius: number, signal?: AbortSignal) =>
    apiRequest<EssentialResult[]>(neighborhoodRequestPaths.essentials(radius), {
      signal,
    }),
  search: (query: string, radius: number, signal?: AbortSignal) =>
    apiRequest<NearbyPlace[]>(neighborhoodRequestPaths.search(query, radius), { signal }),
};
