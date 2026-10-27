"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useHousing } from "@/features/account/api/query-hooks";
import { useIdentity } from "@/features/account/identity";
import { PropertyCard } from "@/features/properties/property-card";
import { discovery } from "@/lib/api/discovery";
import { apiLanguage } from "@/lib/api/config";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

function RecommendationsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="overflow-hidden rounded-2xl border border-border/70 bg-card"
        >
          <Skeleton className="aspect-[16/10] w-full rounded-none" />
          <div className="flex flex-col gap-3 p-4">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardRecommendations() {
  const locale = useLocale();
  const t = useTranslations("Workspace");
  const language = apiLanguage(locale);
  const { userId } = useIdentity();
  const preferences = useHousing(userId);
  const recommendationKind = preferences.data?.district?.trim()
    ? "by-preference-in-my-district"
    : "within-budget";

  const listings = useQuery({
    queryKey: ["recommendations", userId, recommendationKind, language],
    queryFn: ({ signal }) => discovery.personalized(recommendationKind, signal, language),
    enabled: !!preferences.data,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  if (preferences.isPending) return <RecommendationsSkeleton />;
  if (preferences.isError && !preferences.data) {
    return (
      <ErrorState
        error={preferences.error}
        retry={() => void preferences.refetch()}
      />
    );
  }
  if (!preferences.data) {
    return (
      <EmptyState
        title={t("dashboardPreferencesRequired")}
        description={t("dashboardPreferencesRequiredHint")}
      >
        <Button
          nativeButton={false}
          render={<Link href="/profile" />}
        >
          {t("dashboardAddPreferences")}
        </Button>
      </EmptyState>
    );
  }

  if (listings.isPending) return <RecommendationsSkeleton />;
  if (listings.isError && !listings.data) {
    return (
      <ErrorState
        error={listings.error}
        retry={() => void listings.refetch()}
      />
    );
  }
  if (!listings.data?.length) {
    return (
      <EmptyState
        title={t("dashboardNoMatches")}
        description={t("dashboardNoMatchesHint")}
      >
        <Button
          nativeButton={false}
          render={<Link href="/properties" />}
        >
          {t("dashboardExplore")}
        </Button>
      </EmptyState>
    );
  }

  return (
    <div className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3">
      {listings.data.slice(0, 3).map((property, index) => (
        <PropertyCard
          key={`${property.source}:${property.externalId || index}`}
          property={property}
          imageFallback={
            <Image
              src="/hero.png"
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover object-center"
            />
          }
        />
      ))}
    </div>
  );
}
