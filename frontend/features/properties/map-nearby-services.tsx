"use client";
import { useState } from "react";
import { useLocale } from "next-intl";
import { MapPin } from "lucide-react";
import { MadarMap } from "@/components/maps/madar-map";
import { Button } from "@/components/ui/button";
import { ListSkeleton } from "@/components/shared/page-skeleton";
import { categories } from "@/lib/api/discovery-contracts";
import { mapPoiErrorMessage } from "@/lib/api/map-poi";
import { categoryLabel } from "@/lib/maps/place-presentation";
import { propertyDistanceLabel } from "@/lib/maps/nearby-distance";
import { poiIconPaths, type PoiCategory } from "@/lib/maps/poi";
import { validCoordinates, type MapPoint } from "@/lib/maps/points";
import { useMapPois } from "./use-map-pois";
import { cn } from "@/lib/utils";

type Props = {
  property: MapPoint;
  initialCategory?: PoiCategory | null;
  initialSelectedId?: string | null;
};

export function MapNearbyServices(props: Props) {
  const ar = useLocale() === "ar";
  if (!validCoordinates(props.property.latitude, props.property.longitude))
    return (
      <p
        role="status"
        className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground"
      >
        {ar
          ? "موقع هذا البيت غير متاح، لذلك ما نقدر نبحث عن الخدمات القريبة."
          : "This home has no valid location, so nearby services cannot be searched."}
      </p>
    );
  return (
    <LocatedNearbyServices
      key={`${props.property.id}:${props.property.latitude}:${props.property.longitude}`}
      {...props}
    />
  );
}

function LocatedNearbyServices({
  property,
  initialCategory = null,
  initialSelectedId = null,
}: Props) {
  const locale = useLocale();
  const ar = locale === "ar";
  const label = (value: PoiCategory) =>
    ar
      ? categoryLabel(value)
      : (
          {
            supermarket: "Supermarkets",
            hospital: "Hospitals",
            pharmacy: "Pharmacies",
            park: "Parks",
            gym: "Gyms",
            cafe: "Cafés",
            restaurant: "Restaurants",
            school: "Schools",
            shopping_mall: "Shopping malls",
          } satisfies Record<PoiCategory, string>
        )[value];
  const [category, setCategory] = useState<PoiCategory | null>(initialCategory);
  const [selected, setSelected] = useState<string | null>(initialSelectedId);
  const { query, places } = useMapPois(property.latitude, property.longitude, category);
  const points: MapPoint[] = [
    property,
    ...places.map((place) => ({
      id: `geoapify:${place.id}`,
      title: place.name || label(place.category),
      latitude: place.latitude,
      longitude: place.longitude,
      kind: "service" as const,
      provenance: "geoapify" as const,
      category: place.category,
      distanceMeters: place.distance,
      details: place.address,
    })),
  ];
  return (
    <div className="flex min-w-0 flex-col gap-5">
      <MadarMap
        label={ar ? "البيت والخدمات القريبة" : "Home and nearby services"}
        points={points}
        selectedId={selected}
        onSelectPoint={setSelected}
      />
      <p className="text-xs leading-6 text-muted-foreground">
        {ar ? "بيانات الأماكن: " : "Places data: "}
        <a
          href="https://www.geoapify.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Geoapify
        </a>{" "}
        ·{" "}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          © OpenStreetMap contributors
        </a>
        {ar
          ? ". التغطية تعتمد على البيانات المتاحة وليست حصرًا شاملًا."
          : ". Coverage depends on available data and is not exhaustive."}
      </p>
      <section
        aria-label={ar ? "تصنيفات خدمات الخريطة" : "Map service categories"}
        className="flex min-w-0 flex-col gap-4"
      >
        <div>
          <h3 className="text-lg font-semibold">
            {ar ? "استكشف الخدمات حول البيت" : "Explore nearby services"}
          </h3>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">
            {ar
              ? "اختر تصنيفًا للبحث ضمن كيلومترين. المسافات تقديرية بخط مستقيم، وليست مسافات مشي أو قيادة."
              : "Choose a category within 2 km. Distances are approximate straight-line distances, not walking or driving distances."}
          </p>
        </div>
        <div
          role="group"
          aria-label={ar ? "نوع الخدمة" : "Service category"}
          className="flex min-w-0 gap-2 overflow-x-auto pb-2"
        >
          {categories.map((value) => (
            <Button
              key={value}
              variant={category === value ? "secondary" : "outline"}
              size="sm"
              aria-pressed={category === value}
              className="shrink-0 rounded-full"
              onClick={() => {
                setCategory(value);
                setSelected(null);
              }}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {poiIconPaths[value].map((d) => (
                  <path
                    key={d}
                    d={d}
                  />
                ))}
              </svg>
              {label(value)}
            </Button>
          ))}
        </div>
        {query.isFetching && query.data ? (
          <p
            role="status"
            className="text-xs text-muted-foreground"
          >
            {ar ? "نحدّث الأماكن" : "Updating places"}
          </p>
        ) : null}
        {query.isError ? (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4"
          >
            <div className="text-sm leading-7">
              <p>{mapPoiErrorMessage(query.error, locale)}</p>
              {query.data ? (
                <p className="text-xs text-muted-foreground">
                  {ar
                    ? "المعروض آخر نتائج متاحة لهذا الموقع والتصنيف."
                    : "Showing the last available results for this location and category."}
                </p>
              ) : null}
            </div>
            <Button
              variant="outline"
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
            >
              {ar ? "إعادة المحاولة" : "Retry"}
            </Button>
          </div>
        ) : null}
        {category && query.isPending ? (
          <ListSkeleton kind="services" />
        ) : category && query.data ? (
          <>
            <p
              role="status"
              className="text-xs text-muted-foreground"
            >
              {places.length
                ? ar
                  ? `${places.length} من الأماكن المتاحة، مرتبة من الأقرب`
                  : `${places.length} places, nearest first`
                : ar
                  ? "لا توجد أماكن مطابقة ضمن النتائج المتاحة لهذا التصنيف."
                  : "No matching places found for this category."}
            </p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {places.map((place) => {
                const id = `geoapify:${place.id}`;
                return (
                  <li
                    key={id}
                    className={cn(
                      "min-w-0 rounded-2xl border bg-card p-4",
                      selected === id && "border-primary ring-1 ring-primary/30",
                    )}
                  >
                    <Button
                      variant="ghost"
                      className="h-auto w-full justify-start whitespace-normal p-0 text-start"
                      aria-pressed={selected === id}
                      onClick={() => setSelected(id)}
                    >
                      <MapPin data-icon="inline-start" />
                      <span
                        dir="auto"
                        className="min-w-0 break-words"
                      >
                        {place.name || (ar ? "مكان بدون اسم" : "Unnamed place")}
                      </span>
                    </Button>
                    <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs">
                      <span className="text-muted-foreground">
                        {label(place.category)}
                      </span>
                      <span className="font-medium text-primary">
                        {ar
                          ? propertyDistanceLabel(place.distance, locale)
                          : `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(place.distance! >= 1000 ? place.distance! / 1000 : place.distance!)} ${place.distance! >= 1000 ? "km" : "m"} from property`}
                      </span>
                    </div>
                    {place.address ? (
                      <details className="mt-2 text-xs">
                        <summary className="cursor-pointer rounded font-medium text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          {ar ? "تفاصيل المكان" : "Place details"}
                        </summary>
                        <p
                          dir="auto"
                          className="mt-2 break-words text-start leading-6 text-muted-foreground"
                        >
                          {place.address}
                        </p>
                      </details>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </>
        ) : !category ? (
          <p className="text-xs text-muted-foreground">
            {ar
              ? "اختر أحد التصنيفات لإظهار علاماته وقائمة الأماكن."
              : "Choose a category to show its places and map markers."}
          </p>
        ) : null}
      </section>
    </div>
  );
}
