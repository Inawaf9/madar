import type { ApiResponse, SavedProperty, SavedPropertyInput, SavedSummary } from "./contracts";

import { apiRequest } from "./client";
import { ApiError } from "./errors";
import { emptyListOnMissing } from "./optional-record";

export const savedPropertiesApi = {
  summary: (id: number, signal?: AbortSignal) => apiRequest<SavedSummary>(`/api/v1/saved-property/summary/${id}`, { signal }),
  check: async (id: number, source: string, externalId: string, signal?: AbortSignal) => { const result = await apiRequest<unknown>(`/api/v1/saved-property/check/${id}?${new URLSearchParams({ source, externalId })}`, { signal }); if (typeof result !== "boolean") throw new ApiError("Invalid saved-state response", 502); return result; },
  get: (userId: number, signal?: AbortSignal) => emptyListOnMissing(apiRequest<SavedProperty[]>(`/api/v1/saved-property/get/${userId}`, { signal }), "No saved properties found for this user"),
  add: (userId: number, body: SavedPropertyInput) => apiRequest<ApiResponse>(`/api/v1/saved-property/add/${userId}`, { method: "POST", body }),
  remove: (userId: number, id: number) => apiRequest<ApiResponse>(`/api/v1/saved-property/delete/${userId}/${id}`, { method: "DELETE" }),
};
