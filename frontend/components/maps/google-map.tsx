/// <reference types="google.maps" />
"use client";
import { useEffect, useId, useState } from "react";
import { Map, Marker, AdvancedMarker, InfoWindow, useMap, useApiLoadingStatus, APILoadingStatus } from "@vis.gl/react-google-maps";
import { useTheme } from "next-themes";
import { Skeleton } from "@/components/ui/skeleton";
export type MapPoint = { id: string; title: string; latitude: number | null; longitude: number | null; description?: string | null };
export function validCoordinates(latitude: unknown, longitude: unknown): boolean { return typeof latitude === "number" && Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 && typeof longitude === "number" && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180; }
function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap(); const signature = points.map(p => `${p.id}:${p.latitude}:${p.longitude}`).join("|");
  useEffect(() => { if (!map || !points.length) return; const bounds = new google.maps.LatLngBounds(); for (const p of points) bounds.extend({ lat: p.latitude!, lng: p.longitude! }); if (points.length === 1) { map.setCenter(bounds.getCenter()); map.setZoom(14); } else map.fitBounds(bounds, 48); }, [map, signature, points]);
  return null;
}
function LoadedMap({ points, label }: { points: MapPoint[]; label: string }) {
  const status = useApiLoadingStatus(); const { resolvedTheme } = useTheme(); const [selected, setSelected] = useState<MapPoint | null>(null); const id = useId();
  if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) return <MapMessage>تعذّر تحميل خرائط Google. تحقق من اتصالك وإعداد المفتاح ثم أعد تحميل الصفحة.</MapMessage>;
  if (status !== APILoadingStatus.LOADED) return <Skeleton aria-label="جارٍ تحميل الخريطة" className="h-full w-full" />;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
  const visibleSelected = selected ? points.find(point => point.id === selected.id) : undefined;
  return <Map id={id} key={resolvedTheme} mapId={mapId || undefined} defaultCenter={{ lat: points[0].latitude!, lng: points[0].longitude! }} defaultZoom={14} colorScheme={resolvedTheme === "dark" ? "DARK" : "LIGHT"} gestureHandling="cooperative" aria-label={label} disableDefaultUI={false}>
    <FitBounds points={points} />
    {points.map(point => { const position = { lat: point.latitude!, lng: point.longitude! }; return mapId ? <AdvancedMarker key={point.id} position={position} title={point.title} onClick={() => setSelected(point)} /> : <Marker key={point.id} position={position} title={point.title} onClick={() => setSelected(point)} />; })}
    {visibleSelected ? <InfoWindow position={{ lat: visibleSelected.latitude!, lng: visibleSelected.longitude! }} onCloseClick={() => setSelected(null)}><div dir="auto" className="max-w-64 bg-card p-2 font-sans text-card-foreground"><strong>{visibleSelected.title}</strong>{visibleSelected.description ? <p className="mt-1 text-sm">{visibleSelected.description}</p> : null}</div></InfoWindow> : null}
  </Map>;
}
function MapMessage({ children }: { children: React.ReactNode }) { return <div role="status" className="flex h-full items-center justify-center bg-secondary p-6 text-center text-sm leading-7 text-secondary-foreground">{children}</div>; }
export function GoogleMap({ points, label = "خريطة المواقع" }: { points: MapPoint[]; label?: string }) {
  const valid = Array.from(new globalThis.Map(points.filter(p => validCoordinates(p.latitude, p.longitude)).map(point => [point.id, point])).values());
  return <div className="h-80 w-full overflow-hidden rounded-3xl border bg-card sm:h-96">{!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? <MapMessage>الخريطة غير متاحة حتى إعداد مفتاح خرائط Google للمتصفح. يمكنك متابعة استخدام البيانات والقوائم.</MapMessage> : !valid.length ? <MapMessage>{points.length ? "لا تتوفر إحداثيات صحيحة لهذه المواقع." : "لا توجد مواقع لعرضها على الخريطة."}</MapMessage> : <LoadedMap points={valid} label={label} />}</div>;
}
