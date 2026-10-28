"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/shared/error-state";
import { Panel } from "@/components/shared/panel";
import { useIdentity } from "@/features/account/identity";
import { useHousing } from "@/features/account/api/query-hooks";
import { credits } from "@/lib/api/credits";
import { apiLanguage } from "@/lib/api/config";
import { insights } from "@/lib/api/insights";
import type { RecommendedProperty } from "@/lib/api/insight-contracts";
import { propertyHref } from "@/features/properties/format";
import { Link } from "@/i18n/navigation";

function formatPrice(value: number | null, locale: string) {
  if (value == null) return "—";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(value);
}

function RecommendedHome({ item }: { item: RecommendedProperty }) {
  const locale = useLocale();
  const t = useTranslations("Workspace");
  return (
    <article className="flex min-w-0 flex-col gap-3 rounded-xl border border-border/70 bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="min-w-0 flex-1 font-medium">
          {item.title ?? t("untitledProperty")}
        </h4>
        <Badge variant="secondary">
          {t("matchScoreLabel", { score: item.matchScore })}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        {[item.city, item.neighborhood].filter(Boolean).join(" · ")}
      </p>
      <p className="text-sm font-semibold">{formatPrice(item.price, locale)}</p>
      {item.aiReason ? (
        <p className="text-sm leading-6 text-muted-foreground">{item.aiReason}</p>
      ) : null}
      <Button
        nativeButton={false}
        render={
          <Link
            href={propertyHref({ source: item.source, externalId: item.propertyId })}
          />
        }
        variant="outline"
        className="self-start"
      >
        {t("viewHomeDetails")}
      </Button>
    </article>
  );
}

export function NeighborhoodSuggestionsPanel() {
  const locale = useLocale();
  const t = useTranslations("Workspace");
  const { userId } = useIdentity();
  const cache = useQueryClient();
  const housing = useHousing(userId);
  const [suggestions, setSuggestions] = useState<Awaited<
    ReturnType<typeof insights.suggestNeighborhoods>
  > | null>(null);
  const [selectedDistrictOverride, setSelectedDistrictOverride] = useState<string | null>(
    null,
  );
  const selectedDistrict = selectedDistrictOverride ?? housing.data?.district ?? null;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const homesInFlight = useRef(false);
  const prices = useQuery({
    queryKey: ["credit-service-prices", userId],
    queryFn: ({ signal }) => credits.servicePrices(signal),
    enabled: userId !== null,
  });
  const balance = useQuery({
    queryKey: ["credit-balance", userId],
    queryFn: ({ signal }) => credits.balance(signal),
    enabled: userId !== null,
  });
  const suggest = useMutation({
    mutationFn: () => insights.suggestNeighborhoods(apiLanguage(locale)),
    retry: 0,
    onSuccess: setSuggestions,
  });
  const select = useMutation({
    mutationFn: insights.selectNeighborhood,
    retry: 0,
    onSuccess: async (_result, district) => {
      setSelectedDistrictOverride(district);
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["housing-preference", userId] }),
        cache.invalidateQueries({ queryKey: ["recommendations", userId] }),
      ]);
    },
  });
  const homes = useMutation({
    mutationFn: () => insights.selectedNeighborhoodProperties(apiLanguage(locale)),
    retry: 0,
    onSuccess: () => setConfirmOpen(false),
    onSettled: async () => {
      homesInFlight.current = false;
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["credit-balance", userId] }),
        cache.invalidateQueries({ queryKey: ["credit-transactions", userId] }),
      ]);
    },
  });
  const cost = prices.data?.TOP_3_RECOMMENDATIONS;
  const canRequestHomes =
    selectedDistrict &&
    cost != null &&
    balance.data != null &&
    balance.data.balance >= cost &&
    !homes.isPending;

  function requestHomes() {
    if (homesInFlight.current || !canRequestHomes) return;
    homesInFlight.current = true;
    homes.mutate();
  }

  return (
    <Panel
      title={t("neighborhoodSuggestionsTitle")}
      description={t("neighborhoodSuggestionsDescription")}
    >
      <div className="flex flex-wrap items-center gap-3">
        <Button
          disabled={!housing.data || suggest.isPending}
          onClick={() => suggest.mutate()}
        >
          <Sparkles data-icon="inline-start" />
          {suggest.isPending ? t("working") : t("suggestNeighborhoods")}
        </Button>
        <p className="text-xs text-muted-foreground">
          {t("neighborhoodSuggestionsQuotaHint")}
        </p>
      </div>
      {suggest.isError ? (
        <div className="mt-4">
          <ErrorState error={suggest.error} />
        </div>
      ) : null}
      {suggestions ? (
        <div className="mt-5 space-y-4">
          {suggestions.coverageNote ? (
            <p className="text-xs leading-5 text-muted-foreground">
              {suggestions.coverageNote}
            </p>
          ) : null}
          {suggestions.aiAnalysis ? (
            <p className="rounded-xl bg-secondary/50 p-4 text-sm leading-6">
              {suggestions.aiAnalysis}
            </p>
          ) : null}
          {!suggestions.neighborhoods.length ? (
            <p className="text-sm text-muted-foreground">
              {t("noNeighborhoodSuggestions")}
            </p>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {suggestions.neighborhoods.map((item) => (
                <li
                  key={item.district}
                  className={`rounded-xl border p-4 ${selectedDistrict === item.district ? "border-primary bg-primary/5" : "border-border/70"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2">
                      <MapPin
                        className="mt-0.5 size-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <h3 className="font-semibold">{item.district}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t("sampledHomesCount", { count: item.sampledPropertyCount })}
                        </p>
                      </div>
                    </div>
                    {item.matchScore != null ? (
                      <Badge variant="secondary">
                        {t("matchScoreLabel", { score: item.matchScore })}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span>
                      {t("lowestSampledPrice", {
                        price: formatPrice(item.lowestSampledPrice, locale),
                      })}
                    </span>
                    {item.housingScore != null ? (
                      <span>{t("housingScoreLabel", { score: item.housingScore })}</span>
                    ) : null}
                  </div>
                  <Button
                    className="mt-4"
                    size="sm"
                    variant={selectedDistrict === item.district ? "secondary" : "outline"}
                    disabled={select.isPending}
                    onClick={() => {
                      if (selectedDistrict !== item.district) homes.reset();
                      select.mutate(item.district);
                    }}
                  >
                    {selectedDistrict === item.district
                      ? t("neighborhoodSelected")
                      : t("selectNeighborhood")}
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {select.isError ? <ErrorState error={select.error} /> : null}
          <div className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-4">
            <Button
              disabled={
                !selectedDistrict || !canRequestHomes || prices.isError || balance.isError
              }
              onClick={() => setConfirmOpen(true)}
            >
              {t("homesInSelectedNeighborhood")}
            </Button>
            {cost != null ? (
              <span className="text-xs text-muted-foreground">
                {t("neighborhoodHomesCost", {
                  cost,
                  balance: balance.data?.balance ?? "—",
                })}
              </span>
            ) : null}
          </div>
          {cost != null && balance.data && balance.data.balance < cost ? (
            <p className="mt-2 text-sm text-destructive">
              {t("insufficientCredits")}{" "}
              <Link
                href="/payments"
                className="underline"
              >
                {t("payments")}
              </Link>
            </p>
          ) : null}
          {prices.isError || balance.isError ? (
            <ErrorState error={prices.error ?? balance.error} />
          ) : null}
          {homes.isError ? <ErrorState error={homes.error} /> : null}
          {homes.data?.recommendations?.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {homes.data.recommendations.map((item) => (
                <RecommendedHome
                  key={`${item.source}:${item.propertyId}`}
                  item={item}
                />
              ))}
            </div>
          ) : homes.isSuccess ? (
            <p className="text-sm text-muted-foreground">
              {t("noSelectedNeighborhoodHomes")}
            </p>
          ) : null}
        </div>
      ) : null}
      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => !homes.isPending && setConfirmOpen(open)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmNeighborhoodHomesTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmNeighborhoodHomesDescription", {
                district: selectedDistrict ?? "",
                cost: cost ?? "—",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {balance.data && cost != null && balance.data.balance < cost ? (
            <p className="text-sm text-destructive">{t("insufficientCredits")}</p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={homes.isPending}>
              {t("cancel")}
            </AlertDialogCancel>
            <Button
              disabled={!canRequestHomes}
              onClick={requestHomes}
            >
              {homes.isPending ? t("working") : t("confirmAndContinue")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Panel>
  );
}
