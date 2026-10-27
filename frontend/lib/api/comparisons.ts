import { propertyComparisonRequest } from "./resource-requests";
import type { ApiResponse, PropertyComparison, ComparisonInput } from "./contracts";

import { apiRequest } from "./client";

export const comparisonsApi = {
  detail: (id: number, signal?: AbortSignal) =>
    apiRequest<PropertyComparison>(`/api/v1/property-comparison/me/${id}`, { signal }),
  get: (signal?: AbortSignal) =>
    apiRequest<PropertyComparison[]>(`/api/v1/property-comparison/me`, { signal }),
  add: (body: ComparisonInput) =>
    apiRequest<ApiResponse>(`/api/v1/property-comparison/me`, {
      method: "POST",
      body: propertyComparisonRequest(body),
    }),
  update: (id: number, body: ComparisonInput) =>
    apiRequest<ApiResponse>(`/api/v1/property-comparison/me/${id}`, {
      method: "PUT",
      body: propertyComparisonRequest(body),
    }),
  remove: (id: number) =>
    apiRequest<ApiResponse>(`/api/v1/property-comparison/me/${id}`, { method: "DELETE" }),
};
