"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import { useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Check,
  Compass,
  Home,
  MapPin,
  Navigation,
  Search,
  SlidersHorizontal,
  Sparkles,
  Store,
  type LucideIcon,
} from "lucide-react";

import { getProductCopy } from "@/messages/product-copy";
import { QueryFeedback } from "@/components/shared/query-feedback";
import {
  SummarySkeleton,
  ListSkeleton,
  MapSkeleton,
} from "@/components/shared/page-skeleton";
import { neighborhood } from "@/lib/api/neighborhood";
import {
  categories,
  type GooglePlace,
  type EssentialResult,
} from "@/lib/api/discovery-contracts";
import {
  useHome,
  useHomeStatus,
  useHousing,
  usePlaces,
} from "@/features/account/api/query-hooks";
import { useIdentity } from "@/features/account/identity";
import { NeighborhoodAnalysisPanel } from "./neighborhood-analysis";
import { HomePanel } from "@/features/account/current-home-panel";
import { ErrorState } from "@/components/shared/error-state";
import { MadarMap } from "@/components/maps/madar-map";
import { GoogleDataAttribution } from "@/components/maps/google-data-attribution";
import { CommutePanel } from "@/features/payments/commute-panel";
import {
  categoryLabel,
  placeCategory,
  straightLineDistance,
} from "@/lib/maps/place-presentation";
import { getMapPois, mapPoiErrorMessage } from "@/lib/api/map-poi";
import type { MapPoint } from "@/lib/maps/points";
import type { PoiCategory } from "@/lib/maps/poi";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchableSelect } from "@/components/forms/searchable-select";
import { Field, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type SearchMode = "category" | "text" | "essentials";
type SearchRequest = { kind: SearchMode; term: string; radius: number };
type HomeCoordinates = { latitude: number; longitude: number };

function isPoiCategory(value: string): value is PoiCategory {
  return categories.some((category) => category === value);
}

function SectionTitle({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {description ? (
            <p className="mt-1 text-xs leading-6 text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {action}
    </div>
  );
}

function LayerButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "outline"}
      disabled={disabled}
      aria-pressed={disabled ? undefined : active}
      onClick={onClick}
      className="min-h-10 rounded-full"
    >
      {active ? <Check className="size-4" /> : null}
      {children}
    </Button>
  );
}

export function NeighborhoodPage() {
  const locale = useLocale();
  const ar = locale === "ar";
  const text = getProductCopy(locale);
  const { userId } = useIdentity();
  const home = useHome(userId);
  const status = useHomeStatus(userId);
  const hasHome = Boolean(home.data);

  return (
    <main className="mx-auto flex w-full max-w-[1480px] flex-col gap-5 pb-10">
      <header className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0">
          <p className="mb-2 text-xs font-medium text-primary">
            {ar ? "صورة أوضح لحياتك حول المنزل" : "A clearer view of life around home"}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {ar ? "منزلي والحي" : "My Home & Neighborhood"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {ar
              ? "استكشف موقع منزلك ووجهاتك والخدمات القريبة، وافهم ما يتيحه الحي لحياتك اليومية."
              : "Explore your home, daily destinations, and nearby services to understand what the neighborhood offers."}
          </p>
          {home.data ? (
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                <MapPin className="size-3.5 text-primary" />
                {ar ? "موقع المنزل محفوظ" : "Home location saved"}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {status.data?.status === "MOVED_IN"
                  ? ar
                    ? "تم تأكيد الانتقال"
                    : "Move confirmed"
                  : ar
                    ? "لم يؤكد الانتقال بعد"
                    : "Move not confirmed yet"}
              </span>
              <bdi className="tabular-nums">
                {new Intl.NumberFormat(locale, { maximumFractionDigits: 4 }).format(
                  home.data.latitude,
                )}
                ,{" "}
                {new Intl.NumberFormat(locale, { maximumFractionDigits: 4 }).format(
                  home.data.longitude,
                )}
              </bdi>
            </div>
          ) : null}
        </div>
        <Button
          nativeButton={false}
          render={<a href="#current-home-summary" />}
          variant={hasHome ? "outline" : "default"}
          className="min-h-11 shrink-0 rounded-xl"
        >
          <Home className="size-4" />
          {hasHome
            ? ar
              ? "إدارة منزلي"
              : "Manage my home"
            : ar
              ? "أضف منزلك"
              : "Add your home"}
        </Button>
      </header>

      <QueryFeedback query={home} />
      <QueryFeedback query={status} />

      {home.isPending || status.isPending ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,0.95fr)]">
          <MapSkeleton />
          <SummarySkeleton />
        </div>
      ) : home.isError && !home.data ? (
        <ErrorState
          error={home.error}
          retry={() => void home.refetch()}
        />
      ) : status.isError && !status.data ? (
        <ErrorState
          error={status.error}
          retry={() => void status.refetch()}
        />
      ) : !home.data || home.data.id == null ? (
        <section
          id="current-home-summary"
          className="scroll-mt-24 rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-7"
        >
          <HomePanel showMap={false} />
          <p className="mt-4 text-sm text-muted-foreground">{text.homeSetup}</p>
        </section>
      ) : (
        <HomeNeighborhoodWorkspace
          userId={userId}
          home={{ latitude: home.data.latitude, longitude: home.data.longitude }}
          homeId={home.data.id}
        />
      )}
    </main>
  );
}

function HomeNeighborhoodWorkspace({
  userId,
  home,
  homeId,
}: {
  userId: number;
  home: HomeCoordinates;
  homeId: number;
}) {
  const id = useId();
  const locale = useLocale();
  const ar = locale === "ar";
  const text = getProductCopy(locale);
  const preference = useHousing(userId);
  const places = usePlaces(userId);
  const [mode, setMode] = useState<SearchMode>("category");
  const [category, setCategory] = useState<PoiCategory>("supermarket");
  const [query, setQuery] = useState("");
  const [radius, setRadius] = useState("2000");
  const [request, setRequest] = useState<SearchRequest | null>(null);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [focusTick, setFocusTick] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showHome, setShowHome] = useState(true);
  const [showPlaces, setShowPlaces] = useState(true);
  const [showServicesOnMap, setShowServicesOnMap] = useState(false);
  const [overviewRequested, setOverviewRequested] = useState(false);

  const label = (value: string) =>
    ar ? categoryLabel(value) : value.replaceAll("_", " ");

  // This Google Places batch request is deliberately user-triggered. It is not
  // run simply because the page or map is opened.
  const overview = useQuery({
    queryKey: ["neighborhood", userId, homeId, home.latitude, home.longitude],
    queryFn: ({ signal }) => neighborhood.overview(signal),
    enabled: overviewRequested,
    retry: false,
  });

  // MapLibre accepts Geoapify service points only. Google Places results remain
  // in the attributed list below, in accordance with the existing map boundary.
  const mapServices = useQuery({
    queryKey: [
      "neighborhood-map-services",
      userId,
      homeId,
      category,
      home.latitude,
      home.longitude,
    ],
    queryFn: ({ signal }) => getMapPois(home.latitude, home.longitude, category, signal),
    enabled: showServicesOnMap,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const results = useQuery({
    queryKey: ["neighborhood-search", userId, homeId, request],
    enabled: request !== null,
    retry: false,
    queryFn: async ({ signal }) => {
      if (!request) throw new Error("Missing search request");
      if (request.kind === "essentials") {
        return {
          places: [] as GooglePlace[],
          essentials: await neighborhood.essentials(request.radius, signal),
          distances: [] as { place: GooglePlace; straightLineDistanceMeters: number }[],
        };
      }
      if (request.kind === "text") {
        const distances = await neighborhood.search(request.term, request.radius, signal);
        return {
          places: distances.map((item) => item.place),
          essentials: [] as EssentialResult[],
          distances,
        };
      }
      const data = await neighborhood.category(request.term, request.radius, signal);
      return {
        places: data.places?.filter((item) => item != null) || [],
        essentials: [] as EssentialResult[],
        distances: [] as { place: GooglePlace; straightLineDistanceMeters: number }[],
      };
    },
  });

  const validRadius = Number(radius) > 0 && Number(radius) <= 50000;
  const canSearch =
    validRadius &&
    (mode !== "text" || query.trim().length > 0) &&
    (mode !== "essentials" || Boolean(preference.data));

  function search(nextMode: SearchMode = mode) {
    if (!validRadius || (nextMode === "text" && !query.trim())) return;
    if (nextMode === "essentials" && !preference.data) return;
    const next: SearchRequest = {
      kind: nextMode,
      term: nextMode === "category" ? category : nextMode === "text" ? query.trim() : "",
      radius: Number(radius),
    };
    if (JSON.stringify(next) === JSON.stringify(request)) void results.refetch();
    else setRequest(next);
  }

  const mapPoints = useMemo(() => {
    const homePoint: MapPoint = {
      id: "home",
      title: ar ? "منزلي الحالي" : "Current home",
      latitude: home.latitude,
      longitude: home.longitude,
      provenance: "user",
      kind: "home",
    };
    const destinationPoints: MapPoint[] = (places.data || [])
      .filter(
        (place) => Number.isFinite(place.latitude) && Number.isFinite(place.longitude),
      )
      .map((place) => ({
        id: `place-${place.id}`,
        title: place.name,
        latitude: place.latitude,
        longitude: place.longitude,
        description: ar ? "مكان مهم محفوظ" : "Saved important place",
        provenance: "user",
        kind: "destination",
      }));
    const servicePoints: MapPoint[] = (mapServices.data?.places || []).map((place) => ({
      id: `service-${place.id}`,
      title: place.name || (ar ? "خدمة قريبة" : "Nearby service"),
      latitude: place.latitude,
      longitude: place.longitude,
      description: place.address,
      provenance: "geoapify",
      kind: "service",
      category: place.category,
    }));

    return [
      ...(showHome ? [homePoint] : []),
      ...(showPlaces ? destinationPoints : []),
      ...(showServicesOnMap ? servicePoints : []),
    ];
  }, [
    ar,
    home.latitude,
    home.longitude,
    mapServices.data?.places,
    places.data,
    showHome,
    showPlaces,
    showServicesOnMap,
  ]);

  const listed = results.data?.places || [];
  const selectedPlaceId = selectedPointId?.startsWith("place-")
    ? Number(selectedPointId.slice("place-".length))
    : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,0.95fr)]">
        <section className="min-w-0 rounded-3xl border border-border/60 bg-card p-3 shadow-sm sm:p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1 pt-1">
            <div className="flex items-center gap-2">
              <Navigation className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">
                {ar ? "خريطة المنزل والحي" : "Home & neighborhood map"}
              </h2>
            </div>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
              {mapPoints.length} {ar ? "مواقع ظاهرة" : "visible locations"}
            </span>
          </div>

          <div
            className="mb-3 flex flex-wrap gap-2 px-1"
            aria-label={ar ? "طبقات الخريطة" : "Map layers"}
          >
            <LayerButton
              active={showHome}
              onClick={() => setShowHome((value) => !value)}
            >
              <Home className="size-4" />
              {ar ? "منزلي" : "My home"}
            </LayerButton>
            <LayerButton
              active={showPlaces}
              onClick={() => setShowPlaces((value) => !value)}
            >
              <MapPin className="size-4" />
              {ar ? "أماكني المهمة" : "Important places"}
            </LayerButton>
            <LayerButton
              active={showServicesOnMap}
              onClick={() => setShowServicesOnMap((value) => !value)}
            >
              <Store className="size-4" />
              {ar ? "الخدمات القريبة" : "Nearby services"}
            </LayerButton>
            <LayerButton
              active={false}
              disabled
            >
              <Navigation className="size-4" />
              {ar ? "مسارات التنقل" : "Commute routes"}
            </LayerButton>
          </div>

          <p className="mb-3 px-1 text-xs leading-5 text-muted-foreground">
            {ar
              ? "اختر طبقة لعرضها. لا تتوفر بيانات هندسة المسارات من خدمة التنقل الحالية."
              : "Choose which layers to show. Route geometry is not provided by the current commute service."}
          </p>

          <MadarMap
            label={ar ? "خريطة منزلي وأماكني" : "Map of home and places"}
            points={mapPoints}
            selectedId={selectedPointId}
            focusTick={focusTick}
            onSelectPoint={setSelectedPointId}
            className="[&>section]:h-[390px] sm:[&>section]:h-[480px] xl:[&>section]:h-[570px]"
          />

          {showServicesOnMap ? (
            <div className="mt-3">
              {mapServices.isPending ? (
                <p
                  role="status"
                  className="text-xs text-muted-foreground"
                >
                  {ar ? "جارٍ تحميل الخدمات للخريطة…" : "Loading map services…"}
                </p>
              ) : mapServices.isError ? (
                <p
                  role="alert"
                  className="text-xs text-destructive"
                >
                  {mapPoiErrorMessage(mapServices.error, locale)}
                </p>
              ) : mapServices.data?.places.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {ar
                    ? "لم تظهر خدمات بهذا التصنيف حول المنزل."
                    : "No services in this category were returned near home."}
                </p>
              ) : null}
            </div>
          ) : null}
          {places.isError ? (
            <div className="mt-3">
              <ErrorState
                error={places.error}
                retry={() => void places.refetch()}
              />
            </div>
          ) : null}
        </section>

        <aside className="flex min-w-0 flex-col gap-4">
          <section
            id="current-home-summary"
            className="scroll-mt-24 rounded-3xl border border-border/60 bg-card p-5 shadow-sm"
          >
            <SectionTitle
              icon={Home}
              title={ar ? "منزلي الحالي" : "My current home"}
              description={
                ar
                  ? "الموقع محفوظ بالإحداثيات. العنوان التفصيلي غير متوفر في بيانات المنزل."
                  : "The home is saved by coordinates. A street address is not available in the home data."
              }
            />
            <div className="mt-4">
              <HomePanel
                showMap={false}
                onCenterHome={() => {
                  setShowHome(true);
                  setSelectedPointId("home");
                  setFocusTick((value) => value + 1);
                }}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
            <SectionTitle
              icon={MapPin}
              title={ar ? "أماكني المهمة" : "Important places"}
              description={
                ar
                  ? "وجهاتك المحفوظة تظهر على الخريطة."
                  : "Your saved destinations appear on the map."
              }
              action={
                <Button
                  nativeButton={false}
                  render={<Link href="/locations" />}
                  size="sm"
                  variant="outline"
                >
                  {ar ? "إدارة" : "Manage"}
                </Button>
              }
            />
            <div className="mt-4 space-y-2">
              {places.isPending ? (
                <ListSkeleton />
              ) : places.isError && !places.data ? (
                <ErrorState
                  error={places.error}
                  retry={() => void places.refetch()}
                />
              ) : !places.data?.length ? (
                <div className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                  {ar ? "ما أضفت أماكن مهمة حتى الآن." : "No important places added yet."}
                </div>
              ) : (
                places.data.map((place) => {
                  const active = selectedPlaceId === place.id;
                  return (
                    <button
                      type="button"
                      key={place.id}
                      onClick={() => {
                        setShowPlaces(true);
                        setSelectedPointId(active ? null : `place-${place.id}`);
                        setFocusTick((value) => value + 1);
                      }}
                      aria-pressed={active}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl border p-3 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active
                          ? "border-primary/50 bg-primary/5"
                          : "border-border/60 bg-background hover:bg-muted/40",
                      )}
                    >
                      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <MapPin className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{place.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {ar ? "زيارة أسبوعية" : "Visits per week"}: {place.visitPerWeek}{" "}
                          · {ar ? "الأهمية" : "Importance"}: {place.importance}/5
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            <Button
              nativeButton={false}
              render={<Link href="/locations" />}
              variant="outline"
              className="mt-4 w-full rounded-xl"
            >
              {ar ? "إدارة أماكني واهتماماتي" : "Manage places & interests"}
            </Button>
          </section>
        </aside>
      </div>

      <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
        <SectionTitle
          icon={Activity}
          title={ar ? "التنقل اليومي" : "Daily commute"}
          description={
            ar
              ? "احسب القيادة إلى وجهاتك المحفوظة عند الطلب. الخدمة مدفوعة أو تتطلب صلاحية سارية."
              : "Calculate driving to your saved destinations on demand. This service is paid or requires active access."
          }
        />
        <div className="mt-4">
          <CommutePanel
            latitude={home.latitude}
            longitude={home.longitude}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
        <SectionTitle
          icon={Compass}
          title={ar ? "نظرة على الحي" : "Neighborhood overview"}
          description={
            ar
              ? "ملخص خدمات واقعي يطلب عند الحاجة."
              : "A factual services summary, loaded only when requested."
          }
          action={
            <Button
              type="button"
              variant="outline"
              disabled={overview.isFetching}
              onClick={() => {
                setOverviewRequested(true);
                if (overview.data) void overview.refetch();
              }}
            >
              <Compass className="size-4" />
              {overview.isFetching
                ? ar
                  ? "جارٍ التحديث"
                  : "Loading"
                : overview.data
                  ? ar
                    ? "تحديث الملخص"
                    : "Refresh summary"
                  : ar
                    ? "استكشف الخدمات الأساسية"
                    : "Explore essential services"}
            </Button>
          }
        />
        <div className="mt-4">
          {!overviewRequested ? (
            <p className="rounded-2xl border border-dashed p-5 text-sm leading-6 text-muted-foreground">
              {ar
                ? "لم يتم طلب بيانات الخدمات بعد. اضغط لاستكشاف المتاجر والصيدليات والمستشفيات القريبة."
                : "Service data has not been requested yet. Choose Explore to load nearby supermarkets, pharmacies, and hospitals."}
            </p>
          ) : (
            <>
              <QueryFeedback query={overview} />
              {overview.isPending ? (
                <SummarySkeleton />
              ) : overview.isError && !overview.data ? (
                <ErrorState
                  error={overview.error}
                  retry={() => void overview.refetch()}
                />
              ) : overview.data ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {overview.data.places.length} {text.returnedPlaces} ·{" "}
                    {text.withinMeters} {overview.data.radiusMeters}
                    {!overview.data.completeInventory ? ` · ${text.partialCoverage}` : ""}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {overview.data.categories.map((item) => (
                      <span
                        key={item.category}
                        className="rounded-full border bg-secondary/40 px-3 py-2 text-xs"
                      >
                        {label(item.category)} · {item.returnedCount}
                      </span>
                    ))}
                  </div>
                  <GoogleDataAttribution />
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
        <SectionTitle
          icon={Store}
          title={ar ? "الخدمات حول منزلي" : "Services near my home"}
          description={
            ar
              ? "ابحث عند الحاجة حسب التصنيف أو الاسم أو اهتماماتك المحفوظة."
              : "Search on demand by category, name, or your saved interests."
          }
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowFilters((value) => !value)}
            >
              <SlidersHorizontal className="size-4" />
              {ar ? "نطاق البحث" : "Search radius"}
            </Button>
          }
        />

        <Tabs
          value={mode}
          onValueChange={(value) => {
            setMode(value as SearchMode);
            setRequest(null);
          }}
          className="mt-5"
        >
          <TabsList className="h-auto max-w-full flex-wrap p-1">
            <TabsTrigger
              value="category"
              className="min-h-10 px-4"
            >
              {text.category}
            </TabsTrigger>
            <TabsTrigger
              value="text"
              className="min-h-10 px-4"
            >
              {ar ? "بالاسم" : "By name"}
            </TabsTrigger>
            <TabsTrigger
              value="essentials"
              className="min-h-10 px-4"
            >
              {ar ? "اهتماماتي" : "My interests"}
            </TabsTrigger>
          </TabsList>
          <div className="mt-5 flex max-w-3xl flex-col gap-4 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <TabsContent
                value="category"
                className="mt-0"
              >
                <Field>
                  <FieldLabel htmlFor={`${id}-category`}>{text.category}</FieldLabel>
                  <SearchableSelect
                    id={`${id}-category`}
                    value={category}
                    options={categories.map((value) => ({ value, label: label(value) }))}
                    onChange={(value) => {
                      if (isPoiCategory(value)) {
                        setCategory(value);
                        setRequest(null);
                      }
                    }}
                  />
                </Field>
              </TabsContent>
              <TabsContent
                value="text"
                className="mt-0"
              >
                <Field>
                  <FieldLabel htmlFor={`${id}-query`}>{text.query}</FieldLabel>
                  <Input
                    id={`${id}-query`}
                    dir="auto"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setRequest(null);
                    }}
                  />
                </Field>
              </TabsContent>
              <TabsContent
                value="essentials"
                className="mt-0"
              >
                <p className="rounded-xl bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
                  {ar
                    ? "اعثر على الخدمات الأقرب بحسب اهتماماتك المحفوظة."
                    : "Find the nearest services based on your saved interests."}
                </p>
              </TabsContent>
            </div>
            <Button
              disabled={!canSearch || results.isFetching}
              onClick={() => search()}
              className="min-h-10 rounded-xl"
            >
              <Search className="size-4" />
              {results.isFetching
                ? ar
                  ? "جارٍ البحث"
                  : "Searching"
                : ar
                  ? "ابحث عن الخدمات"
                  : "Find services"}
            </Button>
          </div>
        </Tabs>

        {showFilters ? (
          <div className="mt-4 max-w-sm rounded-xl border bg-secondary/20 p-4">
            <label
              htmlFor={`${id}-radius`}
              className="mb-2 block text-sm font-medium"
            >
              {text.radius}
            </label>
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
            <p
              className={cn(
                "mt-2 text-xs",
                validRadius ? "text-muted-foreground" : "text-destructive",
              )}
            >
              {validRadius
                ? `${new Intl.NumberFormat(locale).format(Number(radius))} ${ar ? "متر" : "meters"}`
                : ar
                  ? "اختر نطاقًا بين 1 و50,000 متر."
                  : "Choose a radius between 1 and 50,000 meters."}
            </p>
          </div>
        ) : null}

        {mode === "essentials" ? (
          <div className="mt-4">
            <QueryFeedback query={preference} />
            {preference.isError && !preference.data ? (
              <ErrorState
                error={preference.error}
                retry={() => void preference.refetch()}
              />
            ) : !preference.isPending && !preference.data ? (
              <Link
                href="/profile"
                className="text-sm text-primary underline"
              >
                {text.setupInterests}
              </Link>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5">
          <QueryFeedback query={results} />
          {request && results.isPending ? <ListSkeleton kind="services" /> : null}
          {results.isError && !results.data ? (
            <ErrorState
              error={results.error}
              retry={() => void results.refetch()}
            />
          ) : null}

          {results.data?.essentials.length ? (
            <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {results.data.essentials.map((item) => (
                <article
                  key={item.category}
                  className="rounded-2xl border border-border/60 bg-background p-4"
                >
                  <div className="flex items-center gap-2">
                    <div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                      <MapPin className="size-4" />
                    </div>
                    <h3 className="text-sm font-semibold">{label(item.category)}</h3>
                  </div>
                  <p className="mt-3 text-xs leading-6 text-muted-foreground">
                    {item.status === "SEARCH_FAILED"
                      ? text.searchFailed
                      : item.status === "NO_MATCH"
                        ? text.noMatch
                        : `${item.place?.displayName?.text || text.unnamed} · ${straightLineDistance(item.straightLineDistanceMeters, locale)}`}
                  </p>
                  {item.status === "SEARCH_FAILED" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      disabled={results.isFetching}
                      onClick={() => void results.refetch()}
                    >
                      {text.retry}
                    </Button>
                  ) : null}
                </article>
              ))}
            </div>
          ) : null}

          {listed.length ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {listed.map((place, index) => (
                <article
                  key={place.id || index}
                  className="min-w-0 rounded-2xl border border-border/60 bg-background p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Store className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold">
                        {place.displayName?.text || text.unnamed}
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {place.formattedAddress}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {placeCategory(place, locale)} ·{" "}
                    {straightLineDistance(
                      results.data?.distances.find(
                        (distance) =>
                          distance.place === place ||
                          (!!place.id && distance.place.id === place.id),
                      )?.straightLineDistanceMeters,
                      locale,
                    )}
                  </p>
                </article>
              ))}
            </div>
          ) : results.data && !results.data.essentials.length ? (
            <p className="text-sm text-muted-foreground">{text.noResults}</p>
          ) : null}
          {results.data ? <GoogleDataAttribution /> : null}
        </div>
      </section>

      <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
        <SectionTitle
          icon={Sparkles}
          title={ar ? "تحليل الحي والموقع" : "Neighborhood & location analysis"}
          description={
            ar
              ? "أدوات إضافية لفهم المنطقة المحيطة بمنزلك."
              : "Additional tools to understand the area around your home."
          }
        />
        <div className="mt-5">
          <NeighborhoodAnalysisPanel
            initial={{ latitude: home.latitude, longitude: home.longitude }}
          />
        </div>
      </section>
    </div>
  );
}
