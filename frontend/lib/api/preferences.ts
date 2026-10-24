import type { ApiResponse, HousingPreference, HousingPreferenceInput } from "./contracts";

import { apiRequest } from "./client";

import { optionalRecord } from "./optional-record";

export const preferencesApi = {
  get: (userId: number, signal?: AbortSignal) => optionalRecord(apiRequest<HousingPreference>(`/api/v1/housing-preference/get-by-user/${userId}`, { signal }), "Housing preference not found"),
  add: (userId: number, body: HousingPreferenceInput) => apiRequest<ApiResponse>(`/api/v1/housing-preference/add/${userId}`, { method: "POST", body }),
  update: (userId: number, id: number, body: HousingPreferenceInput) => apiRequest<ApiResponse>(`/api/v1/housing-preference/update/${userId}/${id}`, { method: "PUT", body }),
  remove: (userId: number, id: number) => apiRequest<ApiResponse>(`/api/v1/housing-preference/delete/${userId}/${id}`, { method: "DELETE" }),
};
