"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LoaderCircle, MapPinned } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";
import { GoogleDataAttribution } from "@/components/maps/google-data-attribution";
import { useIdentity } from "@/features/account/identity";
import { homeApi } from "@/lib/api/current-home";
import type { NeighborhoodInventory as NeighborhoodInventoryDto } from "@/lib/api/current-home";
import { categoryLabel } from "@/lib/maps/place-presentation";

function InventoryResults({ data }: { data: NeighborhoodInventoryDto }) {
  const locale = useLocale();
  const t = useTranslations("Workspace");
  const places = data.places ?? [];
  const categories = data.categories ?? [];
  if (!places.length)
    return (
      <p className="text-sm text-muted-foreground">{t("neighborhoodInventoryEmpty")}</p>
    );
  return (
    <>
      <ul className="grid gap-3 sm:grid-cols-3">
        {categories.map((category) => (
          <li
            key={category.category}
            className="rounded-xl bg-secondary/50 p-3"
          >
            <p className="text-sm font-medium">
              {categoryLabel(category.category, locale)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("neighborhoodInventoryCount", { count: category.returnedCount })}
            </p>
          </li>
        ))}
      </ul>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {places.slice(0, 9).map((place) => (
          <li
            key={place.id}
            className="min-w-0 rounded-xl border border-border/70 p-3"
          >
            <p
              className="truncate text-sm font-medium"
              dir="auto"
            >
              {place.displayName?.text ?? t("unnamedPlace")}
            </p>
            <p
              className="mt-1 truncate text-xs text-muted-foreground"
              dir="auto"
            >
              {place.primaryType
                ? categoryLabel(place.primaryType, locale)
                : t("nearbyServicesTitle")}
            </p>
          </li>
        ))}
      </ul>
      <GoogleDataAttribution />
    </>
  );
}

export function NeighborhoodInventory({ homeId }: { homeId: number }) {
  const t = useTranslations("Workspace");
  const { userId } = useIdentity();
  const [requested, setRequested] = useState(false);
  const query = useQuery({
    queryKey: ["current-home-neighborhood", userId, homeId],
    queryFn: ({ signal }) => homeApi.neighborhood(signal),
    enabled: requested && userId !== null,
    retry: false,
  });
  return (
    <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-panel sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <MapPinned
            className="mt-0.5 size-5 shrink-0 text-primary"
            aria-hidden="true"
          />
          <div>
            <h2 className="font-semibold">{t("neighborhoodInventoryTitle")}</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {t("neighborhoodInventoryDescription")}
            </p>
          </div>
        </div>
        {!requested ? (
          <Button
            variant="outline"
            disabled={query.isFetching}
            onClick={() => {
              setRequested(true);
            }}
          >
            {query.isFetching ? (
              <LoaderCircle
                className="size-4 animate-spin"
                aria-hidden="true"
              />
            ) : null}
            {t("loadNeighborhoodInventory")}
          </Button>
        ) : null}
      </div>
      {query.isFetching ? (
        <div
          role="status"
          className="mt-4 h-24 animate-pulse rounded-xl bg-secondary"
        />
      ) : query.isError ? (
        <div className="mt-4">
          <ErrorState
            error={query.error}
            retry={() => void query.refetch()}
          />
        </div>
      ) : query.data ? (
        <div className="mt-4">
          <InventoryResults data={query.data} />
        </div>
      ) : null}
    </section>
  );
}
