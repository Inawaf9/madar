import type { ApiResponse, PropertyComparison, ComparisonInput } from "./contracts";

import { apiRequest } from "./client";

export const comparisonsApi = {
  detail: (userId: number, id: number, signal?: AbortSignal) => apiRequest<PropertyComparison>(`/api/v1/property-comparison/get-by-id/${userId}/${id}`, { signal }),
  get: (userId: number, signal?: AbortSignal) => apiRequest<PropertyComparison[]>(`/api/v1/property-comparison/get-by-user/${userId}`, { signal }),
  add: (userId: number, body: ComparisonInput) => apiRequest<ApiResponse>(`/api/v1/property-comparison/add/${userId}`, { method: "POST", body }),
  update: (userId: number, id: number, body: ComparisonInput) => apiRequest<ApiResponse>(`/api/v1/property-comparison/update/${userId}/${id}`, { method: "PUT", body }),
  remove: (userId: number, id: number) => apiRequest<ApiResponse>(`/api/v1/property-comparison/delete/${userId}/${id}`, { method: "DELETE" }),
};
