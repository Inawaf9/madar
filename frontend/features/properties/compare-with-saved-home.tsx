"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Columns3, LoaderCircle, Sparkles } from "lucide-react";
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
import { ErrorState } from "@/components/shared/error-state";
import { Panel } from "@/components/shared/panel";
import { useCurrentUserId } from "@/features/account/session-hooks";
import { useSaved } from "@/features/account/api/query-hooks";
import { credits } from "@/lib/api/credits";
import { apiLanguage } from "@/lib/api/config";
import { insights } from "@/lib/api/insights";
import type { ComputedComparison } from "@/lib/api/insight-contracts";

function ComparedHomes({ result }: { result: ComputedComparison }) {
  const t = useTranslations("Workspace");
  const locale = useLocale();
  const labels: Array<
    ["price" | "area" | "bedrooms" | "match" | "housing" | "commute" | "services", string]
  > = [
    ["price", t("comparisonMetric.price")],
    ["area", t("comparisonMetric.area")],
    ["bedrooms", t("comparisonMetric.bedrooms")],
    ["match", t("comparisonMetric.match")],
    ["housing", t("comparisonMetric.housing")],
    ["commute", t("comparisonMetric.commute")],
    ["services", t("comparisonMetric.servicesScore")],
  ];
  return (
    <div className="mt-5 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {result.properties.map((property) => (
          <article
            key={`${property.source}:${property.externalPropertyId}`}
            className="rounded-xl border border-border/70 p-4"
          >
            <h3 className="font-semibold">{property.title ?? t("untitledProperty")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {property.neighborhood ?? "—"}
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              {labels.map(([key, label]) => {
                const value =
                  key === "price"
                    ? property.price
                    : key === "area"
                      ? property.areaSqm
                      : key === "bedrooms"
                        ? property.bedrooms
                        : key === "match"
                          ? property.matchScore
                          : key === "housing"
                            ? property.housingScore
                            : key === "commute"
                              ? property.commuteScore
                              : property.servicesScore;
                const formatted =
                  value == null
                    ? "—"
                    : key === "price"
                      ? new Intl.NumberFormat(locale, {
                          style: "currency",
                          currency: "SAR",
                          maximumFractionDigits: 0,
                        }).format(Number(value))
                      : `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(Number(value))}${key === "area" ? (locale === "ar" ? " م²" : " m²") : key === "match" || key === "housing" || key === "commute" || key === "services" ? (locale === "ar" ? "٪" : "%") : ""}`;
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-3"
                  >
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium tabular-nums">{formatted}</dd>
                  </div>
                );
              })}
            </dl>
          </article>
        ))}
      </div>
      {result.aiAnalysis ? (
        <div className="rounded-xl bg-secondary/50 p-4 text-sm leading-6">
          {result.aiAnalysis.reason ? <p>{result.aiAnalysis.reason}</p> : null}
          {result.aiAnalysis.alternativeReason ? (
            <p className="mt-2">{result.aiAnalysis.alternativeReason}</p>
          ) : null}
          {result.aiAnalysis.tradeOff ? (
            <p className="mt-2 text-muted-foreground">{result.aiAnalysis.tradeOff}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function CompareWithSavedHome({
  source,
  externalId,
}: {
  source: string;
  externalId: string;
}) {
  const locale = useLocale();
  const t = useTranslations("Workspace");
  const userId = useCurrentUserId();
  const cache = useQueryClient();
  const saved = useSaved(userId);
  const [selectedKey, setSelectedKey] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const requestInFlight = useRef(false);
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
  const candidates = (saved.data ?? []).filter(
    (item) =>
      item.source.toUpperCase() !== source.toUpperCase() ||
      item.externalPropertyId !== externalId,
  );
  const selected = candidates.find(
    (item) => `${item.source}:${item.externalPropertyId}` === selectedKey,
  );
  const cost = prices.data?.AI_COMPARISON;
  const insufficient =
    cost != null && balance.data != null && balance.data.balance < cost;
  const canCompare = !!selected && cost != null && balance.data != null && !insufficient;
  const comparison = useMutation({
    mutationFn: () =>
      insights.compareTwo(
        source,
        externalId,
        selected!.source,
        selected!.externalPropertyId,
        apiLanguage(locale),
      ),
    retry: 0,
    onSuccess: () => setConfirmOpen(false),
    onSettled: async () => {
      requestInFlight.current = false;
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["credit-balance", userId] }),
        cache.invalidateQueries({ queryKey: ["credit-transactions", userId] }),
      ]);
    },
  });

  if (userId === null) return null;
  return (
    <Panel
      title={t("compareWithSavedHomeTitle")}
      description={t("compareWithSavedHomeDescription")}
    >
      {saved.isPending ? (
        <div
          role="status"
          className="h-12 animate-pulse rounded-xl bg-secondary"
        />
      ) : saved.isError ? (
        <ErrorState
          error={saved.error}
          retry={() => void saved.refetch()}
        />
      ) : candidates.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("compareWithSavedHomeEmpty")}</p>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex min-w-0 flex-1 flex-col gap-2 text-sm">
            {t("selectSavedHomeToCompare")}
            <select
              className="h-11 rounded-xl border border-input bg-background px-3"
              value={selectedKey}
              onChange={(event) => {
                setSelectedKey(event.currentTarget.value);
                comparison.reset();
              }}
            >
              <option value="">{t("chooseSavedHome")}</option>
              {candidates.map((item) => (
                <option
                  key={`${item.source}:${item.externalPropertyId}`}
                  value={`${item.source}:${item.externalPropertyId}`}
                >
                  {item.titleSnapshot ||
                    item.titleSnapshotAr ||
                    item.titleSnapshotEn ||
                    item.externalPropertyId}
                </option>
              ))}
            </select>
          </label>
          <Button
            disabled={
              !selected ||
              prices.isError ||
              balance.isError ||
              prices.isPending ||
              balance.isPending ||
              comparison.isPending
            }
            onClick={() => setConfirmOpen(true)}
          >
            <Columns3 data-icon="inline-start" />
            {t("compareHomesAction")}
          </Button>
        </div>
      )}
      {cost != null ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {t("paidComparisonCost", { cost })} ·{" "}
          {t("creditBalanceLabel", { balance: balance.data?.balance ?? "—" })}
        </p>
      ) : null}
      {insufficient ? (
        <p className="mt-2 text-sm text-destructive">
          {t("comparisonInsufficientCredits")}
        </p>
      ) : null}
      {prices.isError || balance.isError ? (
        <div className="mt-3">
          <ErrorState error={prices.error ?? balance.error} />
        </div>
      ) : null}
      {comparison.isError ? (
        <div className="mt-3">
          <ErrorState error={comparison.error} />
        </div>
      ) : null}
      {comparison.data ? <ComparedHomes result={comparison.data} /> : null}
      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => !comparison.isPending && setConfirmOpen(open)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmPaidComparisonTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmPaidComparisonDescription", { cost: cost ?? "—" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={comparison.isPending}>
              {t("cancel")}
            </AlertDialogCancel>
            <Button
              disabled={!canCompare || comparison.isPending}
              onClick={() => {
                if (requestInFlight.current || !canCompare) return;
                requestInFlight.current = true;
                comparison.mutate();
              }}
            >
              {comparison.isPending ? (
                <LoaderCircle
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Sparkles aria-hidden="true" />
              )}
              {comparison.isPending ? t("working") : t("confirmPaidComparison")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Panel>
  );
}
