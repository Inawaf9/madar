"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowUpRight,
  Bookmark,
  Check,
  Columns3,
  MapPin,
  MessageCircle,
  Search,
  Settings2,
} from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { QueryFeedback } from "@/components/shared/query-feedback";
import {
  useComparisons,
  useDashboardSummary,
  useProfileCompletion,
} from "@/features/account/api/query-hooks";
import { useIdentity } from "@/features/account/identity";
import { DashboardRecommendations } from "./dashboard-recommendations";

type StatCardProps = {
  title: string;
  description: string;
  value?: number;
  pending: boolean;
  href: string;
  locale: string;
  icon: typeof Bookmark;
};

function StatCard({
  title,
  description,
  value,
  pending,
  href,
  locale,
  icon: Icon,
}: StatCardProps) {
  return (
    <Link
      href={href}
      className="group flex min-h-36 flex-col justify-between rounded-2xl border border-border/70 bg-card p-5 shadow-panel transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transform-none"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
          <Icon
            aria-hidden="true"
            className="size-5"
          />
        </span>
        <ArrowUpRight
          aria-hidden="true"
          className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 rtl:-scale-x-100 motion-reduce:transform-none"
        />
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-sm font-medium">{title}</span>
          <span className="mt-1 block text-xs text-muted-foreground">{description}</span>
        </span>
        {pending ? (
          <Skeleton className="h-8 w-10 shrink-0" />
        ) : (
          <span className="shrink-0 text-3xl font-semibold tabular-nums">
            {typeof value === "number"
              ? new Intl.NumberFormat(locale).format(value)
              : "—"}
          </span>
        )}
      </div>
    </Link>
  );
}

function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-section font-medium tracking-tight sm:text-2xl">{title}</h2>
        {description ? (
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function DashboardPage() {
  const locale = useLocale();
  const ar = locale === "ar";
  const t = useTranslations("Workspace");
  const { userId, user } = useIdentity();
  const summary = useDashboardSummary(userId);
  const comparisons = useComparisons(userId);
  const completion = useProfileCompletion(userId);

  const stats: StatCardProps[] = [
    {
      title: t("saved"),
      description: t("dashboardSavedDescription"),
      value: summary.data?.savedPropertiesCount,
      pending: summary.isPending,
      href: "/saved",
      locale,
      icon: Bookmark,
    },
    {
      title: t("compare"),
      description: t("dashboardComparisonsDescription"),
      value: comparisons.data?.length,
      pending: comparisons.isPending,
      href: "/compare",
      locale,
      icon: Columns3,
    },
    {
      title: t("locations"),
      description: t("dashboardPlacesDescription"),
      value: summary.data?.importantLocationsCount,
      pending: summary.isPending,
      href: "/locations",
      locale,
      icon: MapPin,
    },
  ];

  const quickActions = [
    {
      title: t("dashboardExplore"),
      description: t("dashboardExploreDescription"),
      icon: Search,
      href: "/properties",
    },
    {
      title: t("dashboardPreferencesAction"),
      description: t("dashboardPreferencesActionDescription"),
      icon: Settings2,
      href: "/profile",
    },
    {
      title: t("dashboardAddPlace"),
      description: t("dashboardAddPlaceDescription"),
      icon: MapPin,
      href: "/locations",
    },
    {
      title: t("dashboardCompare"),
      description: t("dashboardCompareDescription"),
      icon: Columns3,
      href: "/compare",
    },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-8 pb-10">
      <section className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-panel">
        <div className="grid lg:min-h-[22rem] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative order-1 min-h-52 overflow-hidden sm:min-h-64 lg:order-2 lg:min-h-[22rem]">
            <Image
              src="/compare-2.png"
              alt={
                ar
                  ? "منازل عصرية في حي سعودي هادئ"
                  : "Contemporary homes on a quiet Saudi street"
              }
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 48vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-scrim/45 via-transparent to-transparent lg:bg-gradient-to-l lg:from-scrim/30 lg:via-transparent lg:to-transparent rtl:lg:bg-gradient-to-r" />
            {completion.data ? (
              <div className="absolute bottom-4 start-4 flex items-center gap-3 rounded-2xl border border-white/40 bg-card/95 px-4 py-3 shadow-lg backdrop-blur-sm sm:bottom-6 sm:start-6">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-primary">
                  <Check
                    aria-hidden="true"
                    className="size-4"
                  />
                </span>
                <span>
                  <span className="block text-xs text-muted-foreground">
                    {t("dashboardProfileCompletion")}
                  </span>
                  <span className="mt-0.5 block text-sm font-semibold tabular-nums">
                    {new Intl.NumberFormat(locale, {
                      style: "percent",
                      maximumFractionDigits: 0,
                    }).format(completion.data.completionPercentage / 100)}
                    {` ${t("dashboardComplete")}`}
                  </span>
                </span>
                <Link
                  href="/profile"
                  aria-label={t("dashboardCompleteProfile")}
                  className="ms-2 grid size-8 place-items-center rounded-full text-primary hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <ArrowUpRight
                    aria-hidden="true"
                    className="size-4 rtl:-scale-x-100"
                  />
                </Link>
              </div>
            ) : null}
          </div>

          <div className="relative z-10 order-2 flex flex-col justify-center px-6 py-8 sm:px-9 sm:py-10 lg:order-1 lg:px-10 lg:py-12">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <span className="size-2 rounded-full bg-accent" />
              {ar ? "أهلًا بعودتك" : "Welcome back"}
            </div>
            <h1 className="max-w-xl text-editorial font-medium text-foreground">
              {t("welcome", { name: user.fullName })}
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground sm:text-base">
              {t("dashboardWelcomeDescription")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                nativeButton={false}
                render={<Link href="/properties" />}
                className="rounded-xl"
              >
                {t("dashboardExplore")}
                <ArrowUpRight
                  data-icon="inline-end"
                  className="rtl:-scale-x-100"
                />
              </Button>
              <Button
                nativeButton={false}
                render={<Link href="/profile" />}
                variant="outline"
                className="rounded-xl"
              >
                {t("dashboardPreferences")}
                <Settings2 data-icon="inline-end" />
              </Button>
            </div>
            {completion.isPending ? <Skeleton className="mt-5 h-4 w-40" /> : null}
            {completion.isError ? (
              <div className="mt-4 max-w-lg">
                <QueryFeedback query={completion} />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section aria-label={ar ? "ملخص نشاطك" : "Your activity summary"}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map((stat) => (
            <StatCard
              key={stat.href}
              {...stat}
            />
          ))}
        </div>
        {summary.isError && !summary.data ? (
          <div className="mt-3">
            <ErrorState
              error={summary.error}
              retry={() => void summary.refetch()}
            />
          </div>
        ) : null}
        {comparisons.isError && !comparisons.data ? (
          <div className="mt-3">
            <ErrorState
              error={comparisons.error}
              retry={() => void comparisons.refetch()}
            />
          </div>
        ) : null}
      </section>

      <section className="min-w-0">
        <SectionHeading
          title={t("dashboardRecommendations")}
          description={t("dashboardRecommendationsDescription")}
          action={
            <Button
              nativeButton={false}
              render={<Link href="/properties" />}
              variant="outline"
              className="rounded-xl"
            >
              {t("viewAll")}
              <ArrowUpRight
                data-icon="inline-end"
                className="rtl:-scale-x-100"
              />
            </Button>
          }
        />
        <DashboardRecommendations />
      </section>

      <section>
        <SectionHeading
          title={t("dashboardNextSteps")}
          description={t("dashboardNextStepsDescription")}
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex min-h-32 flex-col justify-between rounded-2xl border border-border/70 bg-card p-5 shadow-panel transition-[transform,border-color,box-shadow] hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring motion-reduce:transform-none"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
                  <action.icon
                    aria-hidden="true"
                    className="size-5"
                  />
                </span>
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 rtl:-scale-x-100 motion-reduce:transform-none"
                />
              </div>
              <span className="mt-5">
                <span className="block font-medium">{action.title}</span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  {action.description}
                </span>
              </span>
            </Link>
          ))}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("madar-assistant-open"))}
            className="group flex min-h-32 flex-col justify-between rounded-2xl border border-border/70 bg-card p-5 text-start shadow-panel transition-[transform,border-color,box-shadow] hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring motion-reduce:transform-none"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
                <MessageCircle
                  aria-hidden="true"
                  className="size-5"
                />
              </span>
              <ArrowUpRight
                aria-hidden="true"
                className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 rtl:-scale-x-100 motion-reduce:transform-none"
              />
            </div>
            <span className="mt-5">
              <span className="block font-medium">{t("dashboardAskAssistant")}</span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                {t("dashboardAskAssistantDescription")}
              </span>
            </span>
          </button>
        </div>
      </section>
    </div>
  );
}
