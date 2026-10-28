"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Route } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";
import { GoogleDataAttribution } from "@/components/maps/google-data-attribution";
import { Link } from "@/i18n/navigation";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useIdentity } from "@/features/account/identity";
import { usePlaces } from "@/features/account/api/query-hooks";
import { credits } from "@/lib/api/credits";
import { payments } from "@/lib/api/payments";
import type { CommuteReport } from "@/lib/api/discovery-contracts";
import { validCoordinates } from "@/lib/maps/points";

function format(value: number, locale: string, digits = 1) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value);
}

export function NeighborhoodCommute({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const locale = useLocale();
  const t = useTranslations("Workspace");
  const { userId } = useIdentity();
  const cache = useQueryClient();
  const places = usePlaces(userId);
  const balance = useQuery({
    queryKey: ["credit-balance", userId],
    queryFn: ({ signal }) => credits.balance(signal),
  });
  const prices = useQuery({
    queryKey: ["credit-service-prices", userId],
    queryFn: ({ signal }) => credits.servicePrices(signal),
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const inFlight = useRef(false);
  const mutation = useMutation({
    mutationFn: () => payments.commute(latitude, longitude),
    retry: 0,
    onSuccess: () => {
      setConfirmOpen(false);
      return cache.invalidateQueries({ queryKey: ["credit-transactions", userId] });
    },
    onSettled: async () => {
      await cache.invalidateQueries({ queryKey: ["credit-balance", userId] });
    },
  });
  const destinations = places.data ?? [];
  const invalidPlace = destinations.find(
    (place) =>
      !validCoordinates(place.latitude, place.longitude) ||
      !Number.isInteger(place.importance) ||
      place.importance < 1 ||
      place.importance > 5 ||
      !Number.isInteger(place.visitPerWeek) ||
      place.visitPerWeek < 0,
  );
  const cost = prices.data?.COMMUTE_REPORT;
  const costLabel = cost == null ? "—" : format(cost, locale, 0);
  const enoughCredits =
    cost != null && balance.data != null && balance.data.balance >= cost;
  const hasWeeklyVisits = destinations.some((place) => place.visitPerWeek > 0);
  const ready = destinations.length > 0 && !invalidPlace && hasWeeklyVisits;
  const canRequest =
    ready &&
    !places.isPending &&
    !balance.isPending &&
    !prices.isPending &&
    !balance.isError &&
    !prices.isError &&
    enoughCredits &&
    !mutation.isPending;
  const report = mutation.data as CommuteReport | undefined;

  function submitCommute() {
    if (!canRequest || inFlight.current) return;
    inFlight.current = true;
    mutation.mutate(undefined, {
      onSettled: () => {
        inFlight.current = false;
      },
    });
  }

  return (
    <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-panel sm:p-6">
      <header className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Route
            aria-hidden="true"
            className="size-5"
          />
        </span>
        <div>
          <h2 className="text-lg font-semibold">{t("dailyCommutesTitle")}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {t("dailyCommutesDescription")}
          </p>
        </div>
      </header>

      {places.isError ? (
        <ErrorState
          error={places.error}
          retry={() => void places.refetch()}
        />
      ) : null}
      {balance.isError ? (
        <ErrorState
          error={balance.error}
          retry={() => void balance.refetch()}
        />
      ) : null}
      {prices.isError ? (
        <ErrorState
          error={prices.error}
          retry={() => void prices.refetch()}
        />
      ) : null}

      {places.isPending || balance.isPending || prices.isPending ? (
        <div
          role="status"
          className="mt-4 h-24 animate-pulse rounded-2xl bg-secondary"
        />
      ) : places.data?.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          <p>{t("commutePlacesRequired")}</p>
          <Button
            nativeButton={false}
            render={<Link href="/locations" />}
            variant="outline"
            className="mt-3"
          >
            {t("managePlaces")}
          </Button>
        </div>
      ) : invalidPlace ? (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <p>{t("invalidImportantPlaces")}</p>
          <Button
            nativeButton={false}
            render={<Link href="/locations" />}
            variant="outline"
            className="mt-3"
          >
            {t("managePlaces")}
          </Button>
        </div>
      ) : !hasWeeklyVisits ? (
        <div className="mt-4 rounded-xl border border-border/70 bg-secondary/30 p-4 text-sm">
          <p>{t("invalidPlaceVisits")}</p>
          <Button
            nativeButton={false}
            render={<Link href="/locations" />}
            variant="outline"
            className="mt-3"
          >
            {t("managePlaces")}
          </Button>
        </div>
      ) : cost != null && balance.data && !enoughCredits ? (
        <div className="mt-4 rounded-xl border border-border/70 bg-secondary/30 p-4">
          <p className="text-sm">
            {t("commuteInsufficientCredits", { cost: costLabel })}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("commuteBalanceLabel", {
              balance: format(balance.data.balance, locale, 0),
            })}
          </p>
          <Button
            nativeButton={false}
            render={<Link href="/payments" />}
            variant="outline"
            className="mt-3"
          >
            {t("buyCredits")}
          </Button>
        </div>
      ) : null}

      {!prices.isPending && prices.data?.COMMUTE_REPORT == null ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {t("commutePriceUnavailable")}
        </p>
      ) : null}

      {!places.isPending &&
      !balance.isPending &&
      !prices.isPending &&
      ready &&
      enoughCredits ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-secondary/40 p-4">
          <div className="text-sm">
            <p>
              {t("commuteCostBalance", {
                cost: costLabel,
                balance:
                  balance.data == null ? "—" : format(balance.data.balance, locale, 0),
              })}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("commuteChargedOnConfirm")}
            </p>
          </div>
          <Button
            disabled={!canRequest}
            onClick={() => setConfirmOpen(true)}
          >
            {t("calculateCommute")}
          </Button>
        </div>
      ) : null}

      {mutation.isError ? (
        <div className="mt-4">
          <ErrorState
            error={mutation.error}
            retry={() => {
              mutation.reset();
              setConfirmOpen(true);
            }}
            retryDisabled={mutation.isPending}
          />
        </div>
      ) : null}

      {report ? (
        <div className="mt-4 space-y-4 rounded-2xl border border-border/70 p-4">
          <dl className="grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">{t("weeklyCommute")}</dt>
              <dd className="mt-1 font-semibold tabular-nums">
                {report.totalWeeklyHours == null
                  ? "—"
                  : `${format(report.totalWeeklyHours, locale)} ${t("hours")}`}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t("commuteScoreLabel")}</dt>
              <dd className="mt-1 font-semibold tabular-nums">
                {report.commuteScore == null
                  ? "—"
                  : `${format(report.commuteScore, locale)}%`}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                {t("commuteDestinationsCount")}
              </dt>
              <dd className="mt-1 font-semibold tabular-nums">
                {report.commutes.length}
              </dd>
            </div>
          </dl>
          <ul className="divide-y divide-border/60">
            {report.commutes.map((commute) => (
              <li
                key={commute.placePreferenceId}
                className="flex flex-wrap justify-between gap-2 py-3 text-sm"
              >
                <span className="font-medium">{commute.placeName}</span>
                <span className="text-muted-foreground">
                  {commute.durationMinutes == null
                    ? "—"
                    : `${format(commute.durationMinutes, locale)} ${t("minutesShort")}`}{" "}
                  ·{" "}
                  {commute.distanceKm == null
                    ? "—"
                    : `${format(commute.distanceKm, locale)} ${t("kmShort")}`}
                </span>
              </li>
            ))}
          </ul>
          <GoogleDataAttribution />
        </div>
      ) : null}

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => !mutation.isPending && setConfirmOpen(open)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmCommuteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmCommuteDescription", { cost: costLabel })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.isPending}>
              {t("cancel")}
            </AlertDialogCancel>
            <Button
              disabled={!canRequest}
              onClick={submitCommute}
            >
              {mutation.isPending ? t("working") : t("confirmCommute")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
