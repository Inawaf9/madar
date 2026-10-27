import { apiRequest } from "./client";
import type { ApiResponse, UserNotification } from "./contracts";
export const notificationsApi = {
  get: (signal?: AbortSignal) =>
    apiRequest<UserNotification[]>("/api/v1/notification/me", { signal }),
  unread: (signal?: AbortSignal) =>
    apiRequest<UserNotification[]>("/api/v1/notification/me/unread", { signal }),
  unreadCount: (signal?: AbortSignal) =>
    apiRequest<{ unreadCount: number }>("/api/v1/notification/me/unread-count", {
      signal,
    }),
  markRead: (notificationId: number) =>
    apiRequest<ApiResponse>(`/api/v1/notification/me/${notificationId}/read`, {
      method: "PUT",
    }),
  markAllRead: () =>
    apiRequest<ApiResponse>("/api/v1/notification/me/read-all", { method: "PUT" }),
  remove: (notificationId: number) =>
    apiRequest<ApiResponse>(`/api/v1/notification/me/${notificationId}`, {
      method: "DELETE",
    }),
};
