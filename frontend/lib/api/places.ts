import { placePreferenceRequest } from "./resource-requests";
import type {
  ApiResponse,
  PlaceInput,
  PlacePreference,
  PlacesSummary,
} from "./contracts";

import { apiRequest } from "./client";
import { emptyListOnMissing } from "./optional-record";

export const placesApi = {
  summary: (signal?: AbortSignal) =>
    apiRequest<PlacesSummary>(`/api/v1/place-preference/me/summary`, { signal }),
  get: (signal?: AbortSignal) =>
    emptyListOnMissing(
      apiRequest<PlacePreference[]>(`/api/v1/place-preference/me`, { signal }),
      "No places found for this user",
    ),
  add: (body: PlaceInput) =>
    apiRequest<ApiResponse>(`/api/v1/place-preference/me`, {
      method: "POST",
      body: placePreferenceRequest(body),
    }),
  update: (id: number, body: PlaceInput) =>
    apiRequest<ApiResponse>(`/api/v1/place-preference/me/${id}`, {
      method: "PUT",
      body: placePreferenceRequest(body),
    }),
  remove: (id: number) =>
    apiRequest<ApiResponse>(`/api/v1/place-preference/me/${id}`, { method: "DELETE" }),
  importance: (id: number, importance: number) =>
    apiRequest<ApiResponse>(
      `/api/v1/place-preference/me/${id}/importance/${importance}`,
      { method: "PATCH" },
    ),
};
