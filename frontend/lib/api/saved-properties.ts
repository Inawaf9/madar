import { savedPropertyRequest } from "./resource-requests";
import type {
  ApiResponse,
  SavedProperty,
  SavedPropertyInput,
  SavedSummary,
} from "./contracts";

import { apiRequest } from "./client";
import { ApiError } from "./errors";
import { emptyListOnMissing } from "./optional-record";

export const savedPropertiesApi = {
  summary: (signal?: AbortSignal) =>
    apiRequest<SavedSummary>(`/api/v1/saved-property/me/summary`, { signal }),
  check: async (source: string, externalId: string, signal?: AbortSignal) => {
    const result = await apiRequest<unknown>(
      `/api/v1/saved-property/me/check?${new URLSearchParams({ source, externalId })}`,
      { signal },
    );
    if (typeof result !== "boolean")
      throw new ApiError("Invalid saved-state response", 502);
    return result;
  },
  get: (signal?: AbortSignal) =>
    emptyListOnMissing(
      apiRequest<SavedProperty[]>(`/api/v1/saved-property/me`, { signal }),
      "No saved properties found for this user",
    ),
  add: (body: SavedPropertyInput) =>
    apiRequest<ApiResponse>(`/api/v1/saved-property/me`, {
      method: "POST",
      body: savedPropertyRequest(body),
    }),
  remove: (id: number) =>
    apiRequest<ApiResponse>(`/api/v1/saved-property/me/${id}`, { method: "DELETE" }),
};
