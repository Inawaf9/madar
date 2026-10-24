import type { ApiResponse, PlaceInput, PlacePreference, PlacesSummary } from "./contracts";

import { apiRequest } from "./client";
import { emptyListOnMissing } from "./optional-record";

export const placesApi = {
  summary: (id: number, signal?: AbortSignal) => apiRequest<PlacesSummary>(`/api/v1/place-preference/summary/${id}`, { signal }),
  get: (userId: number, signal?: AbortSignal) => emptyListOnMissing(apiRequest<PlacePreference[]>(`/api/v1/place-preference/get/${userId}`, { signal }), "No places found for this user"),
  add: (userId: number, body: PlaceInput) => apiRequest<ApiResponse>(`/api/v1/place-preference/add/${userId}`, { method: "POST", body }),
  update: (userId: number, id: number, body: PlaceInput) => apiRequest<ApiResponse>(`/api/v1/place-preference/update/${userId}/${id}`, { method: "PUT", body }),
  remove: (userId: number, id: number) => apiRequest<ApiResponse>(`/api/v1/place-preference/delete/${userId}/${id}`, { method: "DELETE" }),
  importance: (userId: number, id: number, importance: number) => apiRequest<ApiResponse>(`/api/v1/place-preference/importance/${userId}/${id}/${importance}`, { method: "PATCH" }),
};
