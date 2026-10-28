"use client";

import { useId, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Home, MapPin, Search, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchableSelect } from "@/components/forms/searchable-select";
import { Field, FieldLabel } from "@/components/ui/field";
import { ErrorState } from "@/components/shared/error-state";
import { QueryFeedback } from "@/components/shared/query-feedback";
import {
  MapSkeleton,
  SummarySkeleton,
  ListSkeleton,
} from "@/components/shared/page-skeleton";
import { MadarMap } from "@/components/maps/madar-map";
import { GoogleDataAttribution } from "@/components/maps/google-data-attribution";
import { HomePanel } from "@/features/account/current-home-panel";
import {
  useHome,
  useLifestyleInterests,
  usePlaces,
} from "@/features/account/api/query-hooks";
import { useIdentity } from "@/features/account/identity";
import { Link } from "@/i18n/navigation";
import { neighborhood } from "@/lib/api/neighborhood";
import { ApiError } from "@/lib/api/errors";
import {
  categories,
  type EssentialResult,
  type GooglePlace,
} from "@/lib/api/discovery-contracts";
import type { PlacePreference } from "@/lib/api/contracts";
import type { MapPoint } from "@/lib/maps/points";
import { validCoordinates } from "@/lib/maps/points";
import {
  categoryLabel,
  placeCategory,
  straightLineDistance,
} from "@/lib/maps/place-presentation";
import { NeighborhoodAnalysisPanel } from "./neighborhood-analysis";
import { NeighborhoodCommute } from "./neighborhood-commute";
import { NeighborhoodInventory } from "./neighborhood-inventory";

type SearchMode = "category" | "text" | "essentials";
type SearchRequest = {
  kind: SearchMode;
  term: string;
  radius: number;
  homeSignature: string;
  interestSignature?: string;
};
type NearbyEntry = { place: GooglePlace; distanceMeters: number | null };
type NearbySearchResult = { places: NearbyEntry[]; essentials: EssentialResult[] };

function isServiceCategory(value: string): value is (typeof categories)[number] {
  return categories.some((category) => category === value);
}

function displayNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value);
}

function ImportantPlaces({
  places,
  selectedId,
  onSelect,
}: {
  places: PlacePreference[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const locale = useLocale();
  const t = useTranslations("Workspace");

  if (!places.length) {
    return (
      <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
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
    );
  }

  return (
    <div className="space-y-2">
      {places.map((place) => (
        <button
          type="button"
          key={place.id}
          aria-pressed={selectedId === place.id}
          onClick={() => {
            if (place.id == null) return;
            onSelect(place.id);
          }}
          disabled={
            place.id == null || !validCoordinates(place.latitude, place.longitude)
          }
          className="flex w-full items-center gap-3 rounded-xl border border-border/70 bg-background p-3 text-start transition-colors hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-60 aria-pressed:border-primary/50 aria-pressed:bg-primary/5"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <MapPin
              aria-hidden="true"
              className="size-4"
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{place.name}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {place.type} ·{" "}
              {t("placeVisits", { count: displayNumber(place.visitPerWeek, locale) })}
            </span>
          </span>
        </button>
      ))}
      <Button
        nativeButton={false}
        render={<Link href="/locations" />}
        variant="outline"
        className="w-full"
      >
        {t("managePlaces")}
      </Button>
    </div>
  );
}

export function NeighborhoodPage() {
  const t = useTranslations("Workspace");
  const { userId } = useIdentity();
  const home = useHome(userId);
  const hasHome = Boolean(
    home.data?.id != null && validCoordinates(home.data.latitude, home.data.longitude),
  );

  return (
    <main className="mx-auto flex w-full max-w-[1480px] flex-col gap-5 pb-10">
      <header className="rounded-3xl border border-border/60 bg-card p-5 shadow-panel sm:p-6">
        <p className="text-xs font-medium text-primary">{t("neighborhoodPageEyebrow")}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("neighborhood")}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          {t("neighborhoodPageDescription")}
        </p>
      </header>

      <QueryFeedback query={home} />
      {home.isPending && !home.data ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,0.9fr)]">
          <MapSkeleton />
          <SummarySkeleton />
        </div>
      ) : home.isError && !home.data ? (
        <ErrorState
          error={home.error}
          retry={() => void home.refetch()}
        />
      ) : !hasHome || !home.data ? (
        <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-panel sm:p-6">
          <h2 className="text-lg font-semibold">{t("currentHome")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("PropertyMissingSetup")}
          </p>
          <div className="mt-4">
            <HomePanel showMap={false} />
          </div>
        </section>
      ) : (
        <HomeNeighborhoodWorkspace
          userId={userId}
          homeId={home.data.id!}
          home={{ latitude: home.data.latitude, longitude: home.data.longitude }}
        />
      )}
    </main>
  );
}

function HomeNeighborhoodWorkspace({
  userId,
  homeId,
  home,
}: {
  userId: number;
  homeId: number;
  home: { latitude: number; longitude: number };
}) {
  const id = useId();
  const locale = useLocale();
  const t = useTranslations("Workspace");
  const ar = locale === "ar";
  const places = usePlaces(userId);
  const interests = useLifestyleInterests(userId);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [focusTick, setFocusTick] = useState(0);
  const [mode, setMode] = useState<SearchMode>("category");
  const [category, setCategory] = useState<(typeof categories)[number]>("supermarket");
  const [term, setTerm] = useState("");
  const [radius, setRadius] = useState("2000");
  const [request, setRequest] = useState<SearchRequest | null>(null);
  const validRadius = Number(radius) > 0 && Number(radius) <= 50000;
  const homeSignature = `${homeId}:${home.latitude}:${home.longitude}`;
  const interestSignature = (interests.data ?? [])
    .filter((interest) => interest.active === true)
    .map((interest) => interest.code)
    .sort()
    .join(",");
  const activeRequest = Boolean(
    request &&
    request.homeSignature === homeSignature &&
    (request.kind !== "essentials" || request.interestSignature === interestSignature),
  );

  const points = useMemo<MapPoint[]>(() => {
    const homePoint: MapPoint = {
      id: "home",
      title: ar ? "منزلي الحالي" : "Current home",
      latitude: home.latitude,
      longitude: home.longitude,
      description: ar ? "موقع المنزل المحفوظ" : "Saved home location",
      provenance: "user",
      kind: "home",
    };
    const placePoints = (places.data ?? [])
      .filter(
        (place) => place.id != null && validCoordinates(place.latitude, place.longitude),
      )
      .map((place) => ({
        id: `place-${place.id}`,
        title: place.name,
        description: place.type,
        latitude: place.latitude,
        longitude: place.longitude,
        provenance: "user" as const,
        kind: "destination" as const,
      }));
    return [homePoint, ...placePoints];
  }, [ar, home.latitude, home.longitude, places.data]);

  const results = useQuery<NearbySearchResult>({
    queryKey: ["neighborhood-search", userId, homeId, request],
    enabled: activeRequest,
    retry: false,
    queryFn: async ({ signal }) => {
      if (!request) throw new Error("Missing nearby search request");
      if (request.kind === "essentials") {
        return {
          places: [],
          essentials: await neighborhood.essentials(request.radius, signal),
        };
      }
      if (request.kind === "text") {
        const found = await neighborhood.search(request.term, request.radius, signal);
        return {
          places: found.map(({ place, straightLineDistanceMeters }) => ({
            place,
            distanceMeters: straightLineDistanceMeters,
          })),
          essentials: [],
        };
      }
      const found = await neighborhood.category(request.term, request.radius, signal);
      return {
        places: (found.places ?? [])
          .filter((place): place is GooglePlace => place !== null)
          .map((place) => ({
            place,
            distanceMeters:
              typeof place.distanceKm === "number" ? place.distanceKm * 1000 : null,
          })),
        essentials: [],
      };
    },
  });

  const canSearch =
    validRadius &&
    (mode !== "text" || term.trim().length > 0) &&
    (mode !== "essentials" || (interests.data !== undefined && !interests.isError));

  function submitSearch() {
    if (!canSearch) return;
    const next: SearchRequest = {
      kind: mode,
      term: mode === "category" ? category : mode === "text" ? term.trim() : "",
      radius: Number(radius),
      homeSignature,
      ...(mode === "essentials" ? { interestSignature } : {}),
    };
    if (JSON.stringify(request) === JSON.stringify(next)) void results.refetch();
    else setRequest(next);
  }

  function focusPoint(id: string) {
    setSelectedPointId(id);
    setFocusTick((value) => value + 1);
  }

  const nearbyLabel = (value: string) => categoryLabel(value, locale);

  return (
    <div className="flex flex-col gap-5">
      <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,0.85fr)]">
        <div className="min-w-0 rounded-3xl border border-border/70 bg-card p-3 shadow-panel sm:p-4">
          <div className="mb-3 flex items-center gap-2 px-1">
            <Home
              aria-hidden="true"
              className="size-4 text-primary"
            />
            <h2 className="text-lg font-semibold">{t("PropertyMapTitle")}</h2>
          </div>
          <MadarMap
            label={t("PropertyMapTitle")}
            points={points}
            selectedId={selectedPointId}
            focusTick={focusTick}
            onSelectPoint={setSelectedPointId}
            className="h-[400px] sm:h-[500px] xl:h-[620px]"
          />
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-panel">
            <div className="mb-3 flex items-center gap-2">
              <Home
                aria-hidden="true"
                className="size-4 text-primary"
              />
              <h2 className="text-lg font-semibold">{t("currentHome")}</h2>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              {t("PropertyCoordinates", {
                latitude: displayNumber(home.latitude, locale),
                longitude: displayNumber(home.longitude, locale),
              })}
            </p>
            <HomePanel
              showMap={false}
              onCenterHome={() => focusPoint("home")}
            />
          </section>

          <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-panel">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">{t("locations")}</h2>
              <Button
                nativeButton={false}
                render={<Link href="/locations" />}
                size="sm"
                variant="outline"
              >
                {t("managePlaces")}
              </Button>
            </div>
            {places.isError ? (
              <ErrorState
                error={places.error}
                retry={() => void places.refetch()}
              />
            ) : places.isPending && !places.data ? (
              <ListSkeleton />
            ) : (
              <ImportantPlaces
                places={places.data ?? []}
                selectedId={
                  selectedPointId?.startsWith("place-")
                    ? Number(selectedPointId.slice(6))
                    : null
                }
                onSelect={(placeId) => focusPoint(`place-${placeId}`)}
              />
            )}
          </section>
        </aside>
      </section>

      <NeighborhoodCommute
        latitude={home.latitude}
        longitude={home.longitude}
      />

      <NeighborhoodInventory homeId={homeId} />

      <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-panel sm:p-6">
        <header className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Store
              aria-hidden="true"
              className="size-5"
            />
          </span>
          <div>
            <h2 className="text-lg font-semibold">{t("nearbyServicesTitle")}</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {t("nearbyServicesSearchHint")}
            </p>
          </div>
        </header>

        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem] sm:items-end">
          <Tabs
            value={mode}
            onValueChange={(value) => {
              setMode(value as SearchMode);
              setRequest(null);
            }}
          >
            <TabsList className="h-auto max-w-full flex-wrap p-1">
              <TabsTrigger value="category">{t("categorySearch")}</TabsTrigger>
              <TabsTrigger value="text">{t("keywordSearch")}</TabsTrigger>
              <TabsTrigger value="essentials">{t("myServiceInterests")}</TabsTrigger>
            </TabsList>
            <TabsContent
              value="category"
              className="mt-3"
            >
              <Field>
                <FieldLabel htmlFor={`${id}-category`}>{t("categorySearch")}</FieldLabel>
                <SearchableSelect
                  id={`${id}-category`}
                  value={category}
                  options={categories.map((value) => ({
                    value,
                    label: nearbyLabel(value),
                  }))}
                  onChange={(value) => {
                    if (isServiceCategory(value)) {
                      setCategory(value);
                      setRequest(null);
                    }
                  }}
                />
              </Field>
            </TabsContent>
            <TabsContent
              value="text"
              className="mt-3"
            >
              <Field>
                <FieldLabel htmlFor={`${id}-term`}>{t("keywordSearch")}</FieldLabel>
                <Input
                  id={`${id}-term`}
                  dir="auto"
                  value={term}
                  onChange={(event) => {
                    setTerm(event.target.value);
                    setRequest(null);
                  }}
                  placeholder={t("nearbyServiceTermPlaceholder")}
                />
              </Field>
            </TabsContent>
            <TabsContent
              value="essentials"
              className="mt-3"
            >
              <p className="rounded-xl bg-secondary/40 p-3 text-sm text-muted-foreground">
                {t("nearbySavedInterestsHint")}
              </p>
            </TabsContent>
          </Tabs>
          <div>
            <Field>
              <FieldLabel htmlFor={`${id}-radius`}>{t("radiusMeters")}</FieldLabel>
              <Input
                id={`${id}-radius`}
                type="number"
                inputMode="numeric"
                min="1"
                max="50000"
                value={radius}
                aria-invalid={!validRadius}
                onChange={(event) => {
                  setRadius(event.target.value);
                  setRequest(null);
                }}
              />
            </Field>
            {!validRadius ? (
              <p className="mt-1 text-xs text-destructive">{t("invalidRadius")}</p>
            ) : null}
          </div>
        </div>

        {mode === "essentials" && interests.isPending && !interests.data ? (
          <p
            role="status"
            className="mt-4 text-sm text-muted-foreground"
          >
            {t("loadingServicePreferences")}
          </p>
        ) : null}
        {mode === "essentials" && interests.isError ? (
          <div className="mt-4">
            <ErrorState
              error={interests.error}
              retry={() => void interests.refetch()}
            />
            {interests.error instanceof ApiError &&
            ["Housing preference not found", "Housing preferences not found"].includes(
              interests.error.backendMessage ?? "",
            ) ? (
              <Button
                nativeButton={false}
                render={<Link href="/profile" />}
                variant="outline"
                className="mt-3"
              >
                {t("housingPreferences")}
              </Button>
            ) : null}
          </div>
        ) : null}
        <Button
          className="mt-4"
          disabled={!canSearch || results.isFetching}
          onClick={submitSearch}
        >
          <Search
            aria-hidden="true"
            className="size-4"
          />
          {results.isFetching ? t("searchingServices") : t("searchNearbyServices")}
        </Button>

        {activeRequest ? (
          <div className="mt-5 space-y-4">
            <QueryFeedback query={results} />
            {results.isPending ? (
              <ListSkeleton kind="services" />
            ) : results.isError && !results.data ? (
              <ErrorState
                error={results.error}
                retry={() => void results.refetch()}
                retryDisabled={results.isFetching}
              />
            ) : results.data ? (
              <>
                {results.data.essentials.length ? (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {results.data.essentials.map((item) => (
                      <article
                        key={item.category}
                        className="rounded-2xl border border-border/70 bg-background p-4"
                      >
                        <h3 className="font-medium">{nearbyLabel(item.category)}</h3>
                        <p className="mt-2 text-xs leading-6 text-muted-foreground">
                          {item.status === "SEARCH_FAILED"
                            ? t("serviceSearchFailed")
                            : item.status === "NO_MATCH"
                              ? t("serviceNotFound")
                              : `${item.place?.displayName?.text ?? t("unnamedPlace")} · ${straightLineDistance(item.straightLineDistanceMeters, locale)}`}
                        </p>
                        {item.status === "SEARCH_FAILED" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="mt-3"
                            disabled={results.isFetching}
                            onClick={() => void results.refetch()}
                          >
                            {t("retry")}
                          </Button>
                        ) : null}
                      </article>
                    ))}
                  </div>
                ) : results.data.places.length ? (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {results.data.places.map(({ place, distanceMeters }, index) => (
                      <article
                        key={place.id ?? index}
                        className="min-w-0 rounded-2xl border border-border/70 bg-background p-4"
                      >
                        <h3
                          className="break-words font-medium"
                          dir="auto"
                        >
                          {place.displayName?.text || t("unnamedPlace")}
                        </h3>
                        {place.formattedAddress ? (
                          <p
                            className="mt-1 break-words text-xs leading-5 text-muted-foreground"
                            dir="auto"
                          >
                            {place.formattedAddress}
                          </p>
                        ) : null}
                        <p className="mt-3 text-xs text-muted-foreground">
                          {placeCategory(place, locale)} ·{" "}
                          {straightLineDistance(distanceMeters, locale)}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                    {t("noNearbyServices")}
                  </p>
                )}
                <GoogleDataAttribution />
              </>
            ) : null}
          </div>
        ) : null}
      </section>

      <section>
        <NeighborhoodAnalysisPanel
          initial={{ latitude: home.latitude, longitude: home.longitude }}
          title={t("neighborhoodInsightsTitle")}
          description={t("neighborhoodInsightsDescription")}
        />
      </section>
    </div>
  );
}
