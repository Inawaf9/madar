"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MadarMap } from "@/components/maps/madar-map";
import { ErrorState } from "@/components/shared/error-state";
import { QueryFeedback } from "@/components/shared/query-feedback";
import { Link } from "@/i18n/navigation";
import { usePlaces } from "@/features/account/api/query-hooks";
import { useIdentity } from "@/features/account/identity";
import { invalidateUserData } from "@/features/account/api/invalidation";
import { useQueryClient } from "@tanstack/react-query";
import { placesApi } from "@/lib/api/places";
import { validCoordinates, type MapPoint } from "@/lib/maps/points";
import type { PlaceInput, PlacePreference } from "@/lib/api/contracts";
import { ImportantPlacesPanel } from "./important-places-panel";
import { PlaceEditorDialog } from "./place-editor-dialog";

export function LocationsPage() {
  const t = useTranslations("Workspace");
  const locale = useLocale();
  const { userId } = useIdentity();
  const cache = useQueryClient();
  const places = usePlaces(userId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusTick, setFocusTick] = useState(0);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<PlacePreference | null>(null);
  const [busy, setBusy] = useState(false);

  const points = useMemo<MapPoint[]>(
    () =>
      (places.data ?? [])
        .filter(
          (place) =>
            place.id != null && validCoordinates(place.latitude, place.longitude),
        )
        .map((place) => ({
          id: `place:${place.id}`,
          title: place.name,
          description: place.type,
          latitude: place.latitude,
          longitude: place.longitude,
          provenance: "user",
          kind: "destination",
        })),
    [places.data],
  );
  const selectedPlace = places.data?.find((place) => `place:${place.id}` === selectedId);

  function focusPlace(id: number) {
    const nextId = `place:${id}`;
    setSelectedId(nextId);
    setFocusTick((value) => value + 1);
  }

  async function savePlace(value: PlaceInput) {
    if (userId === null) return;
    setBusy(true);
    try {
      if (editingPlace?.id != null) await placesApi.update(editingPlace.id, value);
      else await placesApi.add(value);
      await invalidateUserData(cache, userId);
      setEditorOpen(false);
      setEditingPlace(null);
    } finally {
      setBusy(false);
    }
  }

  async function deletePlace(id: number) {
    if (userId === null) return;
    await placesApi.remove(id);
    await invalidateUserData(cache, userId);
    if (selectedId === `place:${id}`) setSelectedId(null);
  }

  return (
    <div className="flex min-w-0 flex-col gap-5 pb-10">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border/70 bg-card p-5 shadow-panel">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-secondary text-primary">
            <MapPin
              aria-hidden="true"
              className="size-5"
            />
          </span>
          <div>
            <h1 className="text-page font-semibold tracking-tight">{t("locations")}</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              {t("importantPlacesDescription")}
            </p>
            {!places.isPending && !places.isError ? (
              <p className="mt-2 text-xs font-medium text-primary">
                {t("placesCount", {
                  count: new Intl.NumberFormat(locale).format(places.data?.length ?? 0),
                })}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            nativeButton={false}
            render={<Link href="/neighborhood" />}
            variant="outline"
          >
            {t("openNeighborhood")}
          </Button>
          <Button
            type="button"
            onClick={() => {
              setEditingPlace(null);
              setEditorOpen(true);
            }}
          >
            <Plus data-icon="inline-start" />
            {t("addLocation")}
          </Button>
        </div>
      </header>

      <QueryFeedback query={places} />
      {places.isPending && !places.data ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(18rem,0.8fr)]">
          <div className="h-[460px] animate-pulse rounded-3xl bg-secondary" />
          <div className="h-[460px] animate-pulse rounded-3xl bg-secondary" />
        </div>
      ) : places.isError && !places.data ? (
        <ErrorState
          error={places.error}
          retry={() => void places.refetch()}
        />
      ) : (
        <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(18rem,0.8fr)]">
          <section className="min-w-0 rounded-3xl border border-border/70 bg-card p-3 shadow-panel sm:p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
              <div>
                <h2 className="text-lg font-semibold">{t("placesMapTitle")}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("importantPlacesMapHint")}
                </p>
              </div>
              {selectedPlace ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => focusPlace(selectedPlace.id!)}
                >
                  {t("focusSelectedPlace")}
                </Button>
              ) : null}
            </div>
            <MadarMap
              label={t("placesMapTitle")}
              points={points}
              selectedId={selectedId}
              focusTick={focusTick}
              onSelectPoint={setSelectedId}
              className="h-[420px] sm:h-[540px]"
            />
            {places.data?.length && !points.length ? (
              <p className="mt-3 text-sm text-muted-foreground">
                {t("placesCoordinatesUnavailable")}
              </p>
            ) : null}
            {selectedPlace ? (
              <div className="mt-3 rounded-xl bg-secondary/50 p-3 text-sm">
                <strong dir="auto">{selectedPlace.name}</strong>
                <span
                  className="ms-2 text-muted-foreground"
                  dir="auto"
                >
                  {selectedPlace.type}
                </span>
              </div>
            ) : null}
          </section>

          <ImportantPlacesPanel
            places={places.data ?? []}
            loading={places.isPending}
            error={places.isError ? places.error : undefined}
            retry={() => void places.refetch()}
            selectedId={selectedPlace?.id ?? null}
            onSelect={focusPlace}
            onAdd={() => {
              setEditingPlace(null);
              setEditorOpen(true);
            }}
            onEdit={(place) => {
              setEditingPlace(place);
              setEditorOpen(true);
            }}
            onDelete={deletePlace}
            commute={null}
          />
        </div>
      )}

      <PlaceEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        place={editingPlace}
        busy={busy}
        onSave={savePlace}
      />
    </div>
  );
}
