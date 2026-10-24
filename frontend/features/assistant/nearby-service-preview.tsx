"use client";
import { useState } from "react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMapPois } from "@/features/properties/use-map-pois";
import { type PoiCategory } from "@/lib/maps/poi";
import { propertyDistanceLabel } from "@/lib/maps/nearby-distance";
import { ErrorState } from "@/components/shared/error-state";

/** Explicit, cached read of the existing permitted map-data source. No Google data. */
export function NearbyServicePreview({ latitude, longitude, category, onView }: { latitude: number; longitude: number; category: PoiCategory; onView: (id?: string) => void }) {
  const locale = useLocale(); const ar = locale === "ar"; const [requested, setRequested] = useState(false); const [selected, setSelected] = useState<string | null>(null);
  const { query, places } = useMapPois(latitude, longitude, category, requested);
  return <div className="flex min-w-0 flex-col gap-2">{!requested && !query.data ? <Button size="sm" variant="outline" className="min-h-10 self-start" onClick={() => setRequested(true)}>{ar ? "تحميل خدمات فعلية لهذه الفئة" : "Load actual services for this category"}</Button> : null}{requested && query.isPending ? <Skeleton className="h-20 w-full rounded-xl" /> : null}{query.isError ? <ErrorState error={query.error} retry={() => void query.refetch()} retryDisabled={query.isFetching} /> : null}{query.data ? <><ul className="flex min-w-0 flex-col gap-1">{places.slice(0,3).map(place => <li key={place.id} className="flex min-w-0 flex-col gap-0.5 rounded-xl bg-secondary/30 px-2.5 py-2"><Button size="sm" variant="ghost" className="h-auto min-h-10 justify-start px-0 text-start whitespace-normal" aria-pressed={selected === place.id} onClick={() => setSelected(place.id)}>{place.name || (ar ? "مكان دون اسم" : "Unnamed place")}</Button><span className="text-caption text-muted-foreground">{propertyDistanceLabel(place.distance, locale)} · {ar ? "بخط مستقيم" : "straight-line"}</span>{selected === place.id ? <Button size="sm" variant="ghost" className="self-start px-0" onClick={() => onView(`geoapify:${place.id}`)}>{ar ? "عرض المكان على الخريطة" : "View this place on map"}</Button> : null}</li>)}</ul>{!places.length ? <p role="status" className="text-xs text-muted-foreground">{ar ? "لا أماكن مطابقة ضمن بيانات المصدر المتاحة؛ يمكنك تغيير الفئة." : "No matching places in the available source data. Try another category."}</p> : null}<p className="text-caption text-muted-foreground"><a href="https://www.geoapify.com/" target="_blank" rel="noopener noreferrer" className="underline">Geoapify</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">© OpenStreetMap contributors</a> · {ar ? "نطاق 2 كم، لا يشمل كل الأماكن" : "2 km radius, not a complete inventory"}</p><Button size="sm" variant="ghost" className="self-start" onClick={() => onView()}>{ar ? "عرض بقية النتائج على الخريطة" : "View more results on map"}</Button></> : null}</div>;
}
