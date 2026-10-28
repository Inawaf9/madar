"use client";

import { Check, CheckCheck, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/shared/page-heading";
import {
  useNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "./notifications-query";

type NotificationFilter = "all" | "unread" | "read";

function formatTime(value: string, locale: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
        date,
      );
}

export function NotificationsPage() {
  const locale = useLocale();
  const t = useTranslations("Workspace");
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const query = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const all = query.data ?? [];
  const unread = all.filter((item) => !item.isRead).length;
  const notifications = all.filter((item) =>
    filter === "all" ? true : filter === "unread" ? !item.isRead : item.isRead,
  );
  const filters: NotificationFilter[] = ["all", "unread", "read"];

  return (
    <div className="flex min-w-0 flex-col gap-6 pb-10">
      <PageHeading title={t("notifications")} />
      <section className="rounded-2xl border border-border/70 bg-card shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 p-4 sm:p-5">
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label={t("notificationFilters")}
          >
            {filters.map((value) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={filter === value ? "default" : "outline"}
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
              >
                {t(`notificationFilter.${value}`)}
              </Button>
            ))}
          </div>
          {unread > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
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
        </div>
        {markRead.isError || markAllRead.isError ? (
          <p
            role="alert"
            className="px-5 pt-4 text-sm text-destructive"
          >
            {t("notificationMutationError")}
          </p>
        ) : null}
        {query.isPending ? (
          <div
            role="status"
            className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground"
          >
            <LoaderCircle
              className="size-4 animate-spin"
              aria-hidden="true"
            />
            {t("loadingNotifications")}
          </div>
        ) : query.isError ? (
          <div
            role="alert"
            className="p-8 text-center"
          >
            <p className="text-sm text-muted-foreground">{t("notificationsError")}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void query.refetch()}
              className="mt-4"
            >
              {t("retry")}
            </Button>
          </div>
        ) : notifications.length === 0 ? (
          <p className="p-12 text-center text-sm text-muted-foreground">
            {t("noNotifications")}
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {notifications.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-4 p-4 sm:p-5"
              >
                <span
                  className={`mt-2 size-2.5 shrink-0 rounded-full ${item.isRead ? "bg-muted" : "bg-primary"}`}
                  aria-label={item.isRead ? t("read") : t("unread")}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                    {item.message}
                  </p>
                  <time
                    dateTime={item.createdAt}
                    className="mt-2 block text-xs text-muted-foreground"
                  >
                    {formatTime(item.createdAt, locale)}
                  </time>
                </div>
                {!item.isRead ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={markRead.isPending}
                    onClick={() => markRead.mutate(item.id)}
                    aria-label={t("markNotificationRead", { title: item.title })}
                    className="shrink-0"
                  >
                    <Check
                      aria-hidden="true"
                      className="size-4"
                    />
                    <span className="hidden sm:inline">{t("markRead")}</span>
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
