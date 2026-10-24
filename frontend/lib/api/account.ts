import type { AccountInput, ApiResponse, UserResponse, ProfileCompletion, DashboardSummary } from "./contracts";

import { apiRequest } from "./client";

export const profileApi = {
  completion: (id: number, signal?: AbortSignal) => apiRequest<ProfileCompletion>(`/api/v1/user/profile-completion/${id}`, { signal }),
  dashboard: (id: number, signal?: AbortSignal) => apiRequest<DashboardSummary>(`/api/v1/user/dashboard-summary/${id}`, { signal }),
  update: (userId: number, body: AccountInput) => apiRequest<ApiResponse>(`/api/v1/user/update/${userId}`, { method: "PUT", body }),
  remove: (userId: number) => apiRequest<ApiResponse>(`/api/v1/user/delete/${userId}`, { method: "DELETE" }),
  get: (userId: number, signal?: AbortSignal) => apiRequest<UserResponse>(`/api/v1/user/get/${userId}`, { signal }),
};

export const registerUser = (body: AccountInput) => apiRequest<ApiResponse>("/api/v1/user/register", { method: "POST", body });
