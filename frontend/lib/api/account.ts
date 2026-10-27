import type {
  ApiResponse,
  UserResponse,
  ProfileCompletion,
  DashboardSummary,
} from "./contracts";
import { apiRequest, apiGet } from "./client";
export const profileApi = {
  completion: (signal?: AbortSignal) =>
    apiRequest<ProfileCompletion>("/api/v1/user/me/profile-completion", { signal }),
  dashboard: (signal?: AbortSignal) =>
    apiRequest<DashboardSummary>("/api/v1/user/me/dashboard-summary", { signal }),
  remove: () => apiRequest<ApiResponse>("/api/v1/user/me", { method: "DELETE" }),
  deactivate: () =>
    apiRequest<ApiResponse>("/api/v1/user/me/deactivate", { method: "PUT" }),
  notifications: (enabled: boolean) =>
    apiRequest<ApiResponse>(`/api/v1/user/me/notifications?enabled=${enabled}`, {
      method: "PUT",
    }),
  get: (signal?: AbortSignal) => apiGet<UserResponse>("/api/v1/user/me", {}, signal),
};
