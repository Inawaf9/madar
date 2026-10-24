import type { ApiResponse, CurrentHome, CurrentHomeInput, HomeStatus } from "./contracts";

import { apiRequest } from "./client";

import { optionalRecord } from "./optional-record";

export const homeApi = {
  status: (id: number, signal?: AbortSignal) => apiRequest<HomeStatus>(`/api/v1/current-home/status/${id}`, { signal }),
  get: (userId: number, signal?: AbortSignal) => optionalRecord(apiRequest<CurrentHome>(`/api/v1/current-home/get-by-user/${userId}`, { signal }), "Current home not found for this user"),
  add: (userId: number, body: CurrentHomeInput) => apiRequest<ApiResponse>(`/api/v1/current-home/add/${userId}`, { method: "POST", body }),
  update: (userId: number, id: number, body: CurrentHomeInput) => apiRequest<ApiResponse>(`/api/v1/current-home/update/${userId}/${id}`, { method: "PUT", body }),
  remove: (userId: number, id: number) => apiRequest<ApiResponse>(`/api/v1/current-home/delete/${userId}/${id}`, { method: "DELETE" }),
};
