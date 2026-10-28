"use client";

import { useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, MapPin, Route } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/shared/error-state";
import { useIdentity } from "@/features/account/identity";
import { useLifestyleInterests, usePlaces } from "@/features/account/api/query-hooks";
import { placesApi } from "@/lib/api/places";
import { insights } from "@/lib/api/insights";
import { credits } from "@/lib/api/credits";
import type { Property } from "@/lib/api/discovery-contracts";
import type { SavedProperty } from "@/lib/api/contracts";
import { ApiError } from "@/lib/api/errors";

type ComparisonPlace = SavedProperty & { property?: Property | null };
const fmt = (value: number, locale: string, maximumFractionDigits = 1) =>
  new Intl.NumberFormat(locale, { maximumFractionDigits }).format(value);

export function ComparisonLocationAnalysis({
  properties,
}: {
  properties: ComparisonPlace[];
}) {
  const locale = useLocale();
  const t = useTranslations("Workspace");
  const user = useIdentity();
  const cache = useQueryClient();
  const [servicesRequested, setServicesRequested] = useState(false);
  const [commutes, setCommutes] =
    useState<Awaited<ReturnType<typeof placesApi.commute>>[]>();
  const prices = useQuery({
    queryKey: ["credit-service-prices", user.userId],
    queryFn: ({ signal }) => credits.servicePrices(signal),
    enabled: user.userId !== null,
  });
  const balance = useQuery({
    queryKey: ["credit-balance", user.userId],
    queryFn: ({ signal }) => credits.balance(signal),
    enabled: user.userId !== null,
  });
  const places = usePlaces(user.userId);
  const interests = useLifestyleInterests(user.userId);
  const serviceSupported = (property: ComparisonPlace) =>
    property.source.toUpperCase() === "KITE" &&
    /^\d{1,19}$/.test(property.externalPropertyId);
  const serviceQueries = useQueries({
    queries: properties.map((property) => ({
      queryKey: [
        "comparison-nearby-services",
        user.userId,
        property.source,
        property.externalPropertyId,
      ],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        insights.propertyInterests(property.source, property.externalPropertyId, signal),
      enabled:
        servicesRequested &&
        user.userId !== null &&
        serviceSupported(property) &&
        interests.data?.some((interest) => interest.active === true) === true,
      retry: false,
      staleTime: 10 * 60 * 1000,
    })),
  });
  const commuteMutation = useMutation({
    mutationFn: async () => {
      const locations = properties.map((item) => item.property);
      if (locations.some((item) => item?.latitude == null || item.longitude == null)) {
        throw new Error("coordinates unavailable");
      }
      return Promise.all(
        locations.map((item) => placesApi.commute(item!.latitude!, item!.longitude!)),
      );
    },
    retry: 0,
    onSuccess: setCommutes,
    onSettled: async () => {
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["credit-balance", user.userId] }),
        cache.invalidateQueries({ queryKey: ["credit-transactions", user.userId] }),
      ]);
    },
  });
  const commuteCost = prices.data?.COMMUTE_REPORT;
  const totalCost = commuteCost == null ? null : commuteCost * properties.length;
  const enoughBalance =
    totalCost != null && balance.data != null && balance.data.balance >= totalCost;
  const hasCoordinates =
    properties.length === 2 &&
    properties.every(
      (item) => item.property?.latitude != null && item.property.longitude != null,
    );

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card className="rounded-2xl border-border/70 shadow-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route
              aria-hidden="true"
              className="size-5 text-primary"
            />
            {t("comparisonCommute")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t("commutePrerequisiteHint")}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {places.isError ? (
            <ErrorState
              error={places.error}
              retry={() => void places.refetch()}
            />
          ) : null}
          {!places.isPending && !places.isError && places.data?.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noSavedCommutePlaces")}</p>
          ) : null}
          {commutes ? (
            <div className="grid gap-3 md:grid-cols-2">
              {commutes.map((report, index) => (
                <div
                  key={properties[index].id ?? properties[index].externalPropertyId}
                  className="rounded-xl bg-secondary/40 p-4"
                >
                  <h3 className="mb-3 font-medium">
                    {properties[index].titleSnapshot ||
                      properties[index].property?.title ||
                      properties[index].externalPropertyId}
                  </h3>
                  <div className="mb-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {report.totalWeeklyHours != null ? (
                      <span>
                        {fmt(report.totalWeeklyHours, locale)} {t("weeklyHours")}
                      </span>
                    ) : null}
                    {report.commuteScore != null ? (
                      <span>
                        {t("commuteScoreLabel")}: {fmt(report.commuteScore, locale)}%
                      </span>
                    ) : null}
                  </div>
                  {report.commutes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t("noSavedCommutePlaces")}
                    </p>
                  ) : (
                    report.commutes.map((item) => (
                      <div
                        key={item.placePreferenceId}
                        className="border-t border-border/60 py-2 first:border-0"
                      >
                        {(() => {
                          const other = commutes[1 - index]?.commutes.find(
                            (entry) => entry.placePreferenceId === item.placePreferenceId,
                          );
                          const faster =
                            other?.durationMinutes != null &&
                            item.durationMinutes != null &&
                            item.durationMinutes !== other.durationMinutes &&
                            item.durationMinutes < other.durationMinutes;
                          const shorter =
                            other?.distanceKm != null &&
                            item.distanceKm != null &&
                            item.distanceKm !== other.distanceKm &&
                            item.distanceKm < other.distanceKm;
                          return (
                            <>
                              <p className="text-sm font-medium">
                                {item.placeName || t("comparisonUnavailable")}
                              </p>
                              <p
                                className={`mt-1 text-xs ${faster ? "font-semibold text-primary" : "text-muted-foreground"}`}
                              >
                                {item.durationMinutes == null
                                  ? t("comparisonUnavailable")
                                  : `${fmt(item.durationMinutes, locale, 0)} ${t("minutesShort")}`}{" "}
                                ·{" "}
                                {item.distanceKm == null
                                  ? t("comparisonUnavailable")
                                  : `${fmt(item.distanceKm, locale)} ${t("kilometersShort")}`}
                              </p>
                              {item.visitPerWeek > 0 ? (
                                <p className="text-xs text-muted-foreground">
                                  {t("commuteVisitsPerWeek", {
                                    count: item.visitPerWeek,
                                  })}
                                </p>
                              ) : null}
                              {other?.durationMinutes != null &&
                              item.durationMinutes != null &&
                              item.durationMinutes !== other.durationMinutes ? (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {t("commuteDifference", {
                                    difference: fmt(
                                      Math.abs(
                                        item.durationMinutes - other.durationMinutes,
                                      ),
                                      locale,
                                      0,
                                    ),
                                  })}
                                </p>
                              ) : null}
                              {other?.distanceKm != null &&
                              item.distanceKm != null &&
                              item.distanceKm !== other.distanceKm ? (
                                <p
                                  className={`text-xs ${shorter ? "text-primary" : "text-muted-foreground"}`}
                                >
                                  {t("distanceDifference", {
                                    difference: fmt(
                                      Math.abs(item.distanceKm - other.distanceKm),
                                      locale,
                                    ),
                                  })}
                                </p>
                              ) : null}
                            </>
                          );
                        })()}
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>
          ) : null}
          {commuteMutation.isError ? (
            commuteMutation.error instanceof ApiError &&
            commuteMutation.error.backendMessage ===
              "No important places found for this user" ? (
              <p className="text-sm text-muted-foreground">{t("noSavedCommutePlaces")}</p>
            ) : (
              <ErrorState error={commuteMutation.error} />
            )
          ) : null}
          {commutes ? null : (
            <div className="space-y-2">
              {commuteCost != null ? (
                <p className="text-xs text-muted-foreground">
                  {t("commuteCostNotice", { cost: fmt(totalCost ?? 0, locale) })}
                </p>
              ) : null}
              {totalCost != null && balance.data && balance.data.balance < totalCost ? (
                <p className="text-sm text-destructive">
                  {t("comparisonInsufficientCredits")}
                </p>
              ) : null}
              {!hasCoordinates ? (
                <p className="text-sm text-muted-foreground">
                  {t("commuteCoordinatesMissing")}
                </p>
              ) : null}
              <Button
                type="button"
                variant="outline"
                disabled={
                  !hasCoordinates ||
                  places.isPending ||
                  !places.data?.length ||
                  !enoughBalance ||
                  commuteMutation.isPending ||
                  commuteCost == null
                }
                onClick={() => {
                  if (
                    window.confirm(
                      t("confirmCommuteCost", { cost: fmt(totalCost ?? 0, locale) }),
                    )
                  )
                    commuteMutation.mutate();
                }}
              >
                {commuteMutation.isPending ? (
                  <LoaderCircle
                    className="size-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Route aria-hidden="true" />
                )}
                {t("loadCommuteComparison")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/70 shadow-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin
              aria-hidden="true"
              className="size-5 text-primary"
            />
            {t("comparisonNearbyServices")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("nearbyServicesRequestHint")}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {!servicesRequested ? (
            <Button
              type="button"
              variant="outline"
              disabled={
                interests.isPending ||
                !interests.data?.some((interest) => interest.active === true)
              }
              onClick={() => setServicesRequested(true)}
            >
              {t("loadNearbyServices")}
            </Button>
          ) : null}
          {!interests.isPending &&
          interests.data?.every((interest) => interest.active !== true) ? (
            <p className="text-sm text-muted-foreground">
              {t("noActiveServiceInterests")}
            </p>
          ) : null}
          {serviceQueries.map((query, index) => (
            <div
              key={properties[index].id ?? properties[index].externalPropertyId}
              className="rounded-xl bg-secondary/40 p-4"
            >
              <h3 className="mb-2 font-medium">
                {properties[index].titleSnapshot ||
                  properties[index].property?.title ||
                  properties[index].externalPropertyId}
              </h3>
              {!serviceSupported(properties[index]) ? (
                <p className="text-sm text-muted-foreground">
                  {t("nearbyServicesSourceUnsupported")}
                </p>
              ) : null}
              {query.isPending && serviceSupported(properties[index]) ? (
                <p className="text-sm text-muted-foreground">
                  {t("loadingNearbyServices")}
                </p>
              ) : null}
              {query.isError ? (
                query.error instanceof ApiError &&
                query.error.backendMessage === "Housing preferences not found" ? (
                  <p className="text-sm text-muted-foreground">
                    {t("comparisonPrerequisiteError")}
                  </p>
                ) : (
                  <ErrorState
                    error={query.error}
                    retry={() => void query.refetch()}
                  />
                )
              ) : null}
              {query.data?.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("nearbyServicesUnavailable")}
                </p>
              ) : null}
              {query.data?.map((item) => (
                <div
                  key={item.category}
                  className="flex items-start justify-between gap-3 border-t border-border/60 py-2 first:border-0"
                >
                  {(() => {
                    const other = serviceQueries[1 - index]?.data?.find(
                      (entry) => entry.category === item.category,
                    );
                    const distanceDiff =
                      other?.straightLineDistanceMeters != null &&
                      item.straightLineDistanceMeters != null
                        ? Math.abs(
                            item.straightLineDistanceMeters -
                              other.straightLineDistanceMeters,
                          )
                        : null;
                    const nearer =
                      distanceDiff != null &&
                      other?.straightLineDistanceMeters != null &&
                      item.straightLineDistanceMeters! < other.straightLineDistanceMeters;
                    return (
                      <>
                        <div>
                          <p className="text-sm font-medium">{item.category}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.status === "FOUND"
                              ? item.place?.displayName?.text ||
                                item.place?.formattedAddress ||
                                t("serviceFound")
                              : item.status === "NO_MATCH"
                                ? t("serviceNotFound")
                                : t("serviceSearchFailed")}
                          </p>
                        </div>
                        <div className="shrink-0 text-end">
                          {item.straightLineDistanceMeters != null ? (
                            <span
                              className={`text-xs tabular-nums ${nearer ? "font-semibold text-primary" : "text-muted-foreground"}`}
                            >
                              {item.straightLineDistanceMeters >= 1000
                                ? `${fmt(item.straightLineDistanceMeters / 1000, locale)} ${t("kilometersShort")}`
                                : `${fmt(item.straightLineDistanceMeters, locale, 0)} ${t("metersShort")}`}
                            </span>
                          ) : null}
                          {distanceDiff != null ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {t("serviceDistanceDifference", {
                                difference: fmt(distanceDiff, locale, 0),
                              })}
                            </p>
                          ) : null}
                        </div>
                      </>
                    );
                  })()}
                </div>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
