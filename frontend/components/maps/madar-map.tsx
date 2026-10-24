"use client";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useLocale } from "next-intl";
import { MapSkeleton } from "@/components/product/page-skeleton";
import { renderablePoints, type MapPoint } from "@/lib/maps/points";

const MapLibreMap = dynamic(() => import("./maplibre-map"), { ssr: false, loading: () => <MapSkeleton /> });

export type PickedLocation = { latitude: number; longitude: number };
export type MapLocationSelection = { value: PickedLocation | null; onChange: (point: PickedLocation) => void };

export function MadarMap({ points, label = "خريطة المواقع", selectedId, onSelectPoint, locationSelection }: { points: readonly MapPoint[]; label?: string; selectedId?: string | null; onSelectPoint?: (id: string | null) => void; locationSelection?: MapLocationSelection }) {
  const { resolvedTheme } = useTheme();
  const locale = useLocale();
  const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY?.trim();
  const valid = renderablePoints(points);
  const pointsJson = JSON.stringify(valid);
  const message = !apiKey ? "الخريطة غير متاحة حاليًا. يمكنك متابعة استخدام تفاصيل المواقع والقوائم."
    : !valid.length && !locationSelection ? (points.length ? "لا تتوفر إحداثيات صالحة لهذه المواقع." : "لا توجد مواقع لعرضها على الخريطة.") : null;
  if (message) return <div role="status" className="flex h-80 items-center justify-center rounded-3xl border bg-secondary p-6 text-center text-sm text-secondary-foreground sm:h-96">{message}</div>;
  if (!resolvedTheme) return <MapSkeleton />;
  // Marker/data updates stay inside the live map; only theme/locale remount it.
  return <MapLibreMap key={`${apiKey}:${resolvedTheme}:${locale}`} apiKey={apiKey!} pointsJson={pointsJson} dark={resolvedTheme === "dark"} locale={locale} label={label} selectedId={selectedId} onSelectPoint={onSelectPoint} locationSelection={locationSelection} />;
}
