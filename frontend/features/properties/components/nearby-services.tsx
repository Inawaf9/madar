"use client";
import { QueryFeedback } from "@/components/shared/query-feedback";
import { ListSkeleton } from "@/components/shared/page-skeleton";
import { useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { discovery } from "@/lib/api/discovery";
import { categories } from "@/lib/api/discovery-contracts";
import { GoogleDataAttribution } from "@/components/maps/google-data-attribution";
import { categoryLabel, placeCategory } from "@/lib/maps/place-presentation";
import {
  nearbyPlaceDistanceMeters,
  propertyDistanceLabel,
} from "@/lib/maps/nearby-distance";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import { MapPin, Search } from "lucide-react";

type Category = (typeof categories)[number];
export function NearbyServices({
  latitude,
  longitude,
  showResults = true,
  onShowResults,
}: {
  latitude: number;
  longitude: number;
  showResults?: boolean;
  onShowResults?: () => void;
}) {
  const [category, setCategory] = useState<Category>("supermarket");
  const [request, setRequest] = useState<Category | null>(null);
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const locale = useLocale();
  const t = useTranslations("NearbyServices");
  const query = useQuery({
    queryKey: ["nearby-services", latitude, longitude, request],
    queryFn: ({ signal }) =>
      discovery.nearby(latitude, longitude, request!, 2000, signal),
    enabled: request !== null && showResults,
    retry: false,
  });
  const places = (query.data?.places?.filter((p) => p != null) || [])
    .map((place) => ({
      place,
      distanceMeters: nearbyPlaceDistanceMeters(latitude, longitude, place),
    }))
    .sort((a, b) => {
      if (a.distanceMeters === null) return b.distanceMeters === null ? 0 : 1;
      if (b.distanceMeters === null) return -1;
      return a.distanceMeters - b.distanceMeters;
    });
  const search = (next: Category) => {
    setCategory(next);
    setExpanded(false);
    if (request === next && showResults) {
      if (!query.isFetching) void query.refetch();
    } else setRequest(next);
    onShowResults?.();
  };
  return (
    <section
      aria-labelledby={`${id}-heading`}
      className="flex min-w-0 flex-col gap-4 border-t pt-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id={`${id}-heading`}
            className="text-section font-medium"
          >
            {t("title")}
          </h2>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">
            {t("description")}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={showResults && query.isFetching}
          onClick={() => search(category)}
        >
          <Search data-icon="inline-start" />
          {showResults && query.isFetching ? t("searching") : t("showServices")}
        </Button>
      </div>
      <div
        role="group"
        aria-label={t("categoriesLabel")}
        className="flex min-w-0 gap-2 overflow-x-auto pb-2"
      >
        {categories.map((c) => (
          <Button
            type="button"
            key={c}
            size="sm"
            variant={category === c ? "secondary" : "outline"}
            aria-pressed={category === c}
            className={cn(
              "shrink-0 rounded-full",
              category === c && "border border-primary/30 font-semibold",
            )}
            onClick={() => search(c)}
          >
            {categoryLabel(c, locale)}
          </Button>
        ))}
      </div>
      {showResults ? (
        <div className="flex flex-col gap-4">
          <QueryFeedback query={query} />
          {request && query.isPending ? (
            <ListSkeleton kind="services" />
          ) : query.isError && !query.data ? (
            <ErrorState
              error={query.error}
              retry={() => void query.refetch()}
              retryDisabled={query.isFetching}
            />
          ) : request && query.data ? (
            <>
              <div className="flex flex-col gap-1">
                <p className="text-xs text-muted-foreground">
                  {categoryLabel(request, locale)} ·{" "}
                  {t("resultsCount", { count: places.length })}
                </p>
                <p
                  id={`${id}-distance-method`}
                  className="text-xs leading-6 text-muted-foreground"
                >
                  {t("distanceNote")}
                </p>
              </div>
              {places.length ? (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {(expanded ? places : places.slice(0, 4)).map(
                    ({ place: p, distanceMeters }, i) => (
                      <li
                        key={p.id || i}
                        className="flex min-w-0 items-start gap-3 rounded-2xl border bg-card p-4"
                      >
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                          <MapPin
                            aria-hidden="true"
                            className="size-4"
                          />
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3
                            dir="auto"
                            className="break-words text-start text-sm font-semibold"
                          >
                            {p.displayName?.text || t("unnamedPlace")}
                          </h3>
                          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                            <p className="text-xs text-muted-foreground">
                              {placeCategory(p, locale)}
                            </p>
                            <p
                              aria-describedby={`${id}-distance-method`}
                              className="text-xs font-medium leading-6 text-primary"
                            >
                              <bdi>{propertyDistanceLabel(distanceMeters, locale)}</bdi>
                            </p>
                          </div>
                          {p.formattedAddress ? (
                            <details className="mt-2">
                              <summary className="cursor-pointer rounded text-xs font-medium text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                {t("placeDetails")}
                              </summary>
                              <p
                                dir="auto"
                                className="mt-2 break-words text-start text-xs leading-6 text-muted-foreground"
                              >
                                {p.formattedAddress}
                              </p>
                            </details>
                          ) : null}
                        </div>
                      </li>
                    ),
                  )}
                </ul>
              ) : (
                <EmptyState
                  title={t("noResults")}
                  description={t("noResultsHint")}
                />
              )}
              {places.length > 4 ? (
                <Button
                  type="button"
                  className="self-center"
                  variant="outline"
                  onClick={() => setExpanded((v) => !v)}
                  aria-expanded={expanded}
                >
                  {expanded ? t("showLess") : t("showMore", { count: places.length - 4 })}
                </Button>
              ) : null}
              <GoogleDataAttribution />
            </>
          ) : (
            <p className="rounded-2xl border bg-card p-4 text-sm leading-7 text-muted-foreground">
              {t("startHint")}
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
