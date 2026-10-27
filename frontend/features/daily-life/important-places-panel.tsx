"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { MapPin, Pencil, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteAction } from "@/components/shared/delete-action";
import { ErrorState } from "@/components/shared/error-state";
import type { PlacePreference } from "@/lib/api/contracts";
import type { CommuteReport } from "@/lib/api/discovery-contracts";
import { cn } from "@/lib/utils";

export function ImportantPlacesPanel({
  places,
  loading,
  error,
  retry,
  selectedId,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
  commute,
}: {
  places: PlacePreference[];
  loading: boolean;
  error?: unknown;
  retry: () => void;
  selectedId: number | null;
  onSelect: (id: number) => void;
  onAdd: () => void;
  onEdit: (place: PlacePreference) => void;
  onDelete: (id: number) => Promise<void>;
  commute: CommuteReport | null;
}) {
  const t = useTranslations("Workspace");
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const categories = useMemo(
    () => Array.from(new Set(places.map((place) => place.type).filter(Boolean))),
    [places],
  );
  const filtered = places.filter((place) => {
    const term = search.trim().toLocaleLowerCase(locale);
    return (
      (!category || place.type === category) &&
      (!term ||
        [place.name, place.type].some((value) =>
          value.toLocaleLowerCase(locale).includes(term),
        ))
    );
  });

  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-3xl border border-border/70 bg-card p-4 shadow-panel sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("locations")}</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {t("placesPanelHint")}
          </p>
        </div>
        <Button
          size="icon"
          className="size-10 shrink-0 rounded-xl"
          aria-label={t("addLocation")}
          onClick={onAdd}
        >
          <Plus />
        </Button>
      </div>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label={t("searchPlaces")}
          placeholder={t("searchPlaces")}
          className="h-11 rounded-xl ps-10"
        />
      </div>
      {categories.length > 1 ? (
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label={t("filterPlaces")}
        >
          <Button
            size="sm"
            variant={category ? "outline" : "secondary"}
            aria-pressed={!category}
            onClick={() => setCategory("")}
          >
            {t("allPlaces")}
          </Button>
          {categories.map((type) => (
            <Button
              key={type}
              size="sm"
              variant={category === type ? "secondary" : "outline"}
              aria-pressed={category === type}
              onClick={() => setCategory(type)}
            >
              {type}
            </Button>
          ))}
        </div>
      ) : null}
      {loading ? (
        <div
          className="space-y-3"
          aria-label={t("loadingPlaces")}
        >
          {[0, 1, 2].map((index) => (
            <Skeleton
              key={index}
              className="h-28 rounded-2xl"
            />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          error={error}
          retry={retry}
        />
      ) : places.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-5 text-center">
          <MapPin
            className="mx-auto size-8 text-primary"
            aria-hidden="true"
          />
          <h3 className="mt-3 font-medium">{t("noLocations")}</h3>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {t("noLocationsHint")}
          </p>
          <Button
            className="mt-4"
            onClick={onAdd}
          >
            {t("addLocation")}
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
          {t("noMatches")}
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((place) => {
            const selected = selectedId === place.id;
            const route = commute?.commutes.find(
              (item) => item.placePreferenceId === place.id,
            );
            return (
              <li
                key={place.id}
                className={cn(
                  "rounded-2xl border p-3 transition-colors motion-reduce:transition-none",
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border/70 bg-background/60 hover:border-primary/30",
                )}
              >
                <div className="flex min-w-0 items-start gap-2">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                    <MapPin
                      className="size-5"
                      aria-hidden="true"
                    />
                  </span>
                  <button
                    type="button"
                    className="min-w-0 flex-1 rounded-lg text-start focus-visible:outline-2 focus-visible:outline-primary"
                    aria-pressed={selected}
                    disabled={place.id == null}
                    onClick={() => place.id != null && onSelect(place.id)}
                  >
                    <span
                      className="block break-words font-medium"
                      dir="auto"
                    >
                      {place.name}
                    </span>
                    <span
                      className="mt-0.5 block break-words text-xs text-muted-foreground"
                      dir="auto"
                    >
                      {place.type}
                    </span>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9 shrink-0"
                    aria-label={t("editPlaceNamed", { name: place.name })}
                    disabled={place.id == null}
                    onClick={() => onEdit(place)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    {t("placeImportance", {
                      count: new Intl.NumberFormat(locale).format(place.importance),
                    })}
                  </span>
                  <span>
                    {t("placeVisits", {
                      count: new Intl.NumberFormat(locale).format(place.visitPerWeek),
                    })}
                  </span>
                  {route ? (
                    <span className="font-medium text-primary">
                      {t("placeCommute", {
                        minutes: new Intl.NumberFormat(locale).format(
                          route.durationMinutes,
                        ),
                        distance: new Intl.NumberFormat(locale).format(route.distanceKm),
                      })}
                    </span>
                  ) : null}
                </div>
                {place.id != null ? (
                  <div className="mt-2 border-t border-border/60 pt-1">
                    <DeleteAction
                      onDelete={() => onDelete(place.id!)}
                      label={t("removePlaceNamed", { name: place.name })}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
