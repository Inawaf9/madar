"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/lib/api/notifications";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: ["notifications", "list"] as const,
  count: ["notifications", "unread-count"] as const,
};

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.list,
    queryFn: ({ signal }) => notificationsApi.get(signal),
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.count,
    queryFn: ({ signal }) => notificationsApi.unreadCount(signal),
  });
}

export function useMarkNotificationRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => client.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function useMarkAllNotificationsRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => client.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}
