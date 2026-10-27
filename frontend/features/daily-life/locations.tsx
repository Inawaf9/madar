"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock3, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MadarMap } from "@/components/maps/madar-map";
import { ErrorState } from "@/components/shared/error-state";
import { HomePanel } from "@/features/account/current-home-panel";
import { ImportantPlacesPanel } from "./important-places-panel";
import { NearbyServicesPanel } from "./nearby-services-panel";
import { PlaceEditorDialog } from "./place-editor-dialog";
import { CommutePanel } from "@/features/payments/commute-panel";
import { useHome, usePlaces } from "@/features/account/api/query-hooks";
import { useIdentity } from "@/features/account/identity";
import { invalidateUserData } from "@/features/account/api/invalidation";
import { placesApi } from "@/lib/api/places";
import { getMapPois } from "@/lib/api/map-poi";
import { validCoordinates, type MapPoint } from "@/lib/maps/points";
import { type MapPoi, type PoiCategory } from "@/lib/maps/poi";
import type { PlaceInput, PlacePreference } from "@/lib/api/contracts";
import type { CommuteReport } from "@/lib/api/discovery-contracts";

export function LocationsPage() {
  const t = useTranslations("Workspace");
  const locale = useLocale();
  const { userId } = useIdentity();
  const cache = useQueryClient();
  const home = useHome(userId);
  const places = usePlaces(userId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusTick, setFocusTick] = useState(0);
  const [category, setCategory] = useState<PoiCategory | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<PlacePreference | null>(null);
  const [busy, setBusy] = useState(false);
  const [commuteOpen, setCommuteOpen] = useState(false);
  const [commuteReport, setCommuteReport] = useState<{
    latitude: number;
    longitude: number;
    report: CommuteReport;
  } | null>(null);

  const currentHome =
    home.data && validCoordinates(home.data.latitude, home.data.longitude)
      ? home.data
      : null;
  const nearby = useQuery({
    queryKey: [
      "home-pois",
      userId,
      currentHome?.latitude,
      currentHome?.longitude,
      category,
    ],
    queryFn: ({ signal }) =>
      getMapPois(currentHome!.latitude, currentHome!.longitude, category!, signal),
    enabled: !!currentHome && !!category,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const nearbyPlaces: MapPoi[] = useMemo(() => nearby.data?.places ?? [], [nearby.data]);
  const points = useMemo<MapPoint[]>(() => {
    const homePoint: MapPoint[] = currentHome
      ? [
          {
            id: "home",
            title: t("currentHome"),
            latitude: currentHome.latitude,
            longitude: currentHome.longitude,
            provenance: "user",
            kind: "home",
          },
        ]
      : [];
    const destinationPoints: MapPoint[] = (places.data ?? [])
      .filter(
        (place) => place.id != null && validCoordinates(place.latitude, place.longitude),
      )
      .map((place) => ({
        id: `place:${place.id}`,
        title: place.name,
        description: place.type,
        latitude: place.latitude,
        longitude: place.longitude,
        provenance: "user",
        kind: "destination",
      }));
    const servicePoints: MapPoint[] = nearbyPlaces.map((place) => ({
      id: `service:${place.id}`,
      title: place.name || place.address || t("nearbyServicesTitle"),
      description: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      provenance: "geoapify",
      kind: "service",
      category: place.category,
      details: place.address,
    }));
    return [...homePoint, ...destinationPoints, ...servicePoints];
  }, [currentHome, nearbyPlaces, places.data, t]);
  const selectedPlace = selectedId?.startsWith("place:")
    ? places.data?.find((place) => `place:${place.id}` === selectedId)
    : null;
  const visibleCommute =
    currentHome &&
    commuteReport?.latitude === currentHome.latitude &&
    commuteReport.longitude === currentHome.longitude
      ? commuteReport.report
      : null;

  function focus(id: string) {
    setSelectedId(id);
    setFocusTick((value) => value + 1);
  }

  async function savePlace(value: PlaceInput) {
    setBusy(true);
    try {
      if (editingPlace?.id) await placesApi.update(editingPlace.id, value);
      else await placesApi.add(value);
      await invalidateUserData(cache, userId);
      setCommuteReport(null);
      setEditorOpen(false);
      setEditingPlace(null);
    } finally {
      setBusy(false);
    }
  }

  async function deletePlace(id: number) {
    await placesApi.remove(id);
    await invalidateUserData(cache, userId);
    if (selectedId === `place:${id}`) setSelectedId(null);
    setCommuteReport(null);
  }

  return (
    <div className="flex min-w-0 flex-col gap-5 pb-10">
      <header className="flex min-w-0 items-center justify-between gap-5 overflow-hidden rounded-3xl border border-border/70 bg-card p-4 shadow-panel sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-secondary text-primary">
            <MapPin
              aria-hidden="true"
              className="size-5"
            />
          </span>
          <div className="min-w-0">
            <h1 className="text-page font-semibold tracking-tight">{t("locations")}</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              {t("placesWorkspaceIntro")}
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
        <div
          className="hidden h-24 w-32 shrink-0 overflow-hidden rounded-2xl md:block"
          aria-hidden="true"
        >
          <Image
            src="/hero.png"
            alt=""
            width={320}
            height={240}
            className="size-full object-cover"
          />
        </div>
        <Button
          className="hidden shrink-0 rounded-xl sm:inline-flex"
          onClick={() => {
            setEditingPlace(null);
            setEditorOpen(true);
          }}
        >
          <Plus data-icon="inline-start" />
          {t("addLocation")}
        </Button>
        <Button
          size="icon"
          className="size-10 shrink-0 rounded-xl sm:hidden"
          aria-label={t("addLocation")}
          onClick={() => {
            setEditingPlace(null);
            setEditorOpen(true);
          }}
        >
          <Plus />
        </Button>
      </header>

      <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] xl:grid-cols-[minmax(0,23fr)_minmax(0,54fr)_minmax(0,23fr)]">
        <div className="min-w-0">
          <HomePanel
            showMap={false}
            onCenterHome={() => focus("home")}
          />
        </div>
        <section className="min-w-0 rounded-3xl border border-border/70 bg-card p-3 shadow-panel sm:p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
            <div>
              <h2 className="text-lg font-semibold">{t("placesMapTitle")}</h2>
              <p className="text-xs text-muted-foreground">{t("placesMapHint")}</p>
            </div>
            {currentHome ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => focus("home")}
              >
                {t("centerHome")}
              </Button>
            ) : null}
          </div>
          {home.isPending || places.isPending ? (
            <div
              className="h-[520px] animate-pulse rounded-2xl bg-secondary sm:h-[600px]"
              role="status"
              aria-label={t("loadingPlaces")}
            />
          ) : home.isError && !home.data ? (
            <ErrorState
              error={home.error}
              retry={() => void home.refetch()}
            />
          ) : places.isError && !places.data ? (
            <ErrorState
              error={places.error}
              retry={() => void places.refetch()}
            />
          ) : (
            <MadarMap
              points={points}
              label={t("placesMapTitle")}
              selectedId={selectedId}
              focusTick={focusTick}
              onSelectPoint={setSelectedId}
              className="h-[520px] sm:h-[600px] lg:h-[620px]"
            />
          )}
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
        <div className="min-w-0 lg:col-span-2 xl:col-span-1">
          <ImportantPlacesPanel
            places={places.data ?? []}
            loading={places.isPending}
            error={places.isError && !places.data ? places.error : undefined}
            retry={() => void places.refetch()}
            selectedId={selectedPlace?.id ?? null}
            onSelect={(id) => focus(`place:${id}`)}
            onAdd={() => {
              setEditingPlace(null);
              setEditorOpen(true);
            }}
            onEdit={(place) => {
              setEditingPlace(place);
              setEditorOpen(true);
            }}
            onDelete={deletePlace}
            commute={visibleCommute}
          />
        </div>
      </div>

      <NearbyServicesPanel
        category={category}
        onCategoryChange={(next) => {
          setCategory(next);
          if (selectedId?.startsWith("service:")) setSelectedId(null);
        }}
        places={nearbyPlaces}
        home={currentHome}
        loading={nearby.isPending && !!category && !!currentHome}
        error={nearby.isError ? nearby.error : undefined}
        retry={() => void nearby.refetch()}
        selectedId={selectedId}
        onSelect={focus}
      />

      {currentHome && (places.data?.length ?? 0) > 0 ? (
        <section className="rounded-3xl border border-border/70 bg-card p-4 shadow-panel sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Clock3
                  className="size-5 text-primary"
                  aria-hidden="true"
                />
                {t("commuteTitle")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("commuteCreditHint")}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setCommuteOpen((value) => !value)}
              aria-expanded={commuteOpen}
            >
              {commuteOpen ? t("closeCommute") : t("openCommute")}
            </Button>
          </div>
          {commuteOpen ? (
            <div className="mt-4">
              <CommutePanel
                latitude={currentHome.latitude}
                longitude={currentHome.longitude}
                selectedPlaceId={selectedPlace?.id ?? null}
                onReport={(report) =>
                  setCommuteReport(
                    report
                      ? {
                          latitude: currentHome.latitude,
                          longitude: currentHome.longitude,
                          report,
                        }
                      : null,
                  )
                }
              />
            </div>
          ) : null}
        </section>
      ) : null}

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
