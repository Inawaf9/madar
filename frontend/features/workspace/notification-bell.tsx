"use client";

import { Bell, Check, CheckCheck, LoaderCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from "./notifications-query";

function notificationTime(value: string, locale: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
        date,
      );
}

export function NotificationBell() {
  const locale = useLocale();
  const t = useTranslations("Workspace");
  const notifications = useNotifications();
  const unreadCount = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const items = notifications.data?.slice(0, 5) ?? [];
  const count = unreadCount.data?.unreadCount ?? 0;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("notificationsWithCount", { count })}
            className="relative size-10 shrink-0 rounded-full"
          />
        }
      >
        <Bell aria-hidden="true" />
        {count > 0 ? (
          <span className="absolute -end-0.5 -top-0.5 grid min-h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {count > 99 ? "99+" : new Intl.NumberFormat(locale).format(count)}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="max-h-[min(32rem,calc(100svh-2rem))] w-[min(24rem,calc(100vw-1.5rem))] overflow-y-auto p-0"
      >
        <PopoverHeader className="flex-row items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
          <PopoverTitle>{t("notifications")}</PopoverTitle>
          {count > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
              className="h-8 px-2 text-xs"
            >
              {markAllRead.isPending ? (
                <LoaderCircle
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <CheckCheck
                  className="size-4"
                  aria-hidden="true"
                />
              )}
              {t("markAllNotificationsRead")}
            </Button>
          ) : null}
        </PopoverHeader>
        {notifications.isPending ? (
          <div
            role="status"
            className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground"
          >
            <LoaderCircle
              className="size-4 animate-spin"
              aria-hidden="true"
            />
            {t("loadingNotifications")}
          </div>
        ) : notifications.isError ? (
          <div
            role="alert"
            className="p-5 text-center text-sm text-muted-foreground"
          >
            <p>{t("notificationsError")}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void notifications.refetch()}
              className="mt-3"
            >
              {t("retry")}
            </Button>
          </div>
        ) : items.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            {t("noNotifications")}
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-3 px-4 py-3"
              >
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${item.isRead ? "bg-muted" : "bg-primary"}`}
                  aria-label={item.isRead ? t("read") : t("unread")}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {item.message}
                  </p>
                  <time
                    dateTime={item.createdAt}
                    className="mt-1 block text-xs text-muted-foreground"
                  >
                    {notificationTime(item.createdAt, locale)}
                  </time>
                </div>
                {!item.isRead ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t("markNotificationRead", { title: item.title })}
                    disabled={markRead.isPending}
                    onClick={() => markRead.mutate(item.id)}
                    className="size-8 shrink-0"
                  >
                    <Check
                      aria-hidden="true"
                      className="size-4"
                    />
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <div className="border-t border-border/60 p-2">
          <Button
            nativeButton={false}
            render={<Link href="/notifications" />}
            variant="ghost"
            className="w-full"
          >
            {t("viewAllNotifications")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
