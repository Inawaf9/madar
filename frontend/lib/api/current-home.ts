import type { ApiResponse, CurrentHome, CurrentHomeInput, HomeStatus } from "./contracts";
import { apiRequest } from "./client";
import { optionalRecord } from "./optional-record";
import { currentHomeRequest } from "./resource-requests";
export const homeApi = {
  status: (signal?: AbortSignal) =>
    apiRequest<HomeStatus>("/api/v1/current-home/me/status", { signal }),
  get: (signal?: AbortSignal) =>
    optionalRecord(
      apiRequest<CurrentHome>("/api/v1/current-home/me", { signal }),
      "Current home not found for this user",
    ),
  neighborhood: (signal?: AbortSignal) =>
    apiRequest<NeighborhoodInventory>("/api/v1/current-home/me/neighborhood", { signal }),
  add: (body: CurrentHomeInput) =>
    apiRequest<ApiResponse>("/api/v1/current-home/me", {
      method: "POST",
      body: currentHomeRequest(body),
    }),
  update: (homeId: number, body: CurrentHomeInput) =>
    apiRequest<ApiResponse>(`/api/v1/current-home/me/${homeId}`, {
      method: "PUT",
      body: currentHomeRequest(body),
    }),
  remove: (homeId: number) =>
    apiRequest<ApiResponse>(`/api/v1/current-home/me/${homeId}`, { method: "DELETE" }),
};

export type NeighborhoodInventory = {
  homeId: number;
  location: { latitude: number; longitude: number };
  radiusMeters: number;
  places: Array<{
    id: string;
    displayName?: { text?: string } | null;
    primaryType?: string | null;
    types?: string[] | null;
    location?: { latitude: number; longitude: number } | null;
  }>;
  categories: Array<{ category: string; returnedCount: number; placeIds: string[] }>;
  completeInventory: boolean;
};
