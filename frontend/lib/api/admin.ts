import { apiRequest } from "./client";
import type {
  ApiResponse,
  UserResponse,
  CurrentHome,
  HousingPreference,
  PropertyComparison,
} from "./contracts";
// Only target account IDs are selected by callers. The acting administrator always comes from JWT.
export const adminApi = {
  users: (signal?: AbortSignal) =>
    apiRequest<UserResponse[]>("/api/v1/user/admin/users", { signal }),
  removeUser: (targetUserId: number) =>
    apiRequest<ApiResponse>(`/api/v1/user/admin/users/${targetUserId}`, {
      method: "DELETE",
    }),
  suspend: (targetUserId: number) =>
    apiRequest<ApiResponse>(`/api/v1/user/admin/users/${targetUserId}/suspend`, {
      method: "PUT",
    }),
  unsuspend: (targetUserId: number) =>
    apiRequest<ApiResponse>(`/api/v1/user/admin/users/${targetUserId}/unsuspend`, {
      method: "PUT",
    }),
  homes: (signal?: AbortSignal) =>
    apiRequest<CurrentHome[]>("/api/v1/current-home/get", { signal }),
  preferences: (signal?: AbortSignal) =>
    apiRequest<Omit<HousingPreference, "interests">[]>("/api/v1/housing-preference/get", {
      signal,
    }),
  comparisons: (signal?: AbortSignal) =>
    apiRequest<PropertyComparison[]>("/api/v1/property-comparison/get", { signal }),
};
