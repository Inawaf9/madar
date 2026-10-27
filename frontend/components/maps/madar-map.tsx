"use client";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useLocale } from "next-intl";
import { MapSkeleton } from "@/components/shared/page-skeleton";
import { renderablePoints, type MapPoint } from "@/lib/maps/points";
import type { MapLocationSelection } from "./map-types";
import { cn } from "@/lib/utils";

const MapLibreMap = dynamic(() => import("./maplibre-map"), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

export function MadarMap({
  points,
  label,
  selectedId,
  focusTick,
  onSelectPoint,
  locationSelection,
  className,
}: {
  points: readonly MapPoint[];
  label?: string;
  selectedId?: string | null;
  focusTick?: number;
  onSelectPoint?: (id: string | null) => void;
  locationSelection?: MapLocationSelection;
  className?: string;
}) {
  const { resolvedTheme } = useTheme();
  const locale = useLocale();
  const mapLabel = label ?? (locale === "ar" ? "خريطة المواقع" : "Location map");
  const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY?.trim();
  const valid = renderablePoints(points);
  const pointsJson = JSON.stringify(valid);
  const message = !apiKey
    ? locale === "ar"
      ? "الخريطة مو متاحة الآن. تقدر تكمل باستخدام تفاصيل المواقع والقوائم."
      : "The map is unavailable right now. You can still use location details and lists."
    : !valid.length && !locationSelection
      ? points.length
        ? locale === "ar"
          ? "مواقع هذه الأماكن غير متاحة على الخريطة."
          : "These locations cannot be shown on the map."
        : locale === "ar"
          ? "ما فيه مواقع لعرضها على الخريطة."
          : "No locations to show on the map."
      : null;
  if (message)
    return (
      <div
        role="status"
        className={cn(
          "flex items-center justify-center rounded-3xl border bg-secondary p-6 text-center text-sm text-secondary-foreground",
          className || "h-80 sm:h-96",
        )}
      >
        {message}
      </div>
    );
  if (!resolvedTheme) return <MapSkeleton className={className} />;
  // Marker/data updates stay inside the live map; only theme/locale remount it.
  return (
    <MapLibreMap
      key={`${apiKey}:${resolvedTheme}:${locale}`}
      apiKey={apiKey!}
      pointsJson={pointsJson}
      dark={resolvedTheme === "dark"}
      locale={locale}
      label={mapLabel}
      selectedId={selectedId}
      focusTick={focusTick}
      onSelectPoint={onSelectPoint}
      locationSelection={locationSelection}
      className={className}
    />
  );
}
