"use client";
import { useState } from "react";
import { MapPin, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MadarMap } from "./madar-map";
import { validCoordinates, type MapPoint } from "@/lib/maps/points";
import { NearbyServices } from "@/features/properties/nearby-services";
import { CommutePanel } from "@/features/payments/commute-panel";
import { NeighborhoodAnalysisPanel } from "@/features/product/neighborhood-analysis";
import { PersonalPropertyInsights } from "@/features/properties/personal-property-insights";
import { MapNearbyServices } from "@/features/properties/map-nearby-services";

/** Geoapify POIs share the map; Google Places/Routes stay in separate views. */
export function PropertyLocationExperience({ point, propertyReference }: { point: MapPoint; propertyReference?: { source: string; externalId: string } }) {
  const [view, setView] = useState<"map" | "services" | "commute" | "analysis" | "property">("map");
  const located = validCoordinates(point.latitude, point.longitude);
  return <section className="flex min-w-0 flex-col gap-5" aria-label="الموقع والحياة اليومية">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-section font-medium">موقع العقار ومحيطه</h2><p className="mt-1 text-sm leading-7 text-muted-foreground">تعرّف على الموقع، ثم استكشف الخدمات أو خيارات التنقل.</p></div><Button size="sm" variant={view === "commute" ? "secondary" : "outline"} aria-pressed={view === "commute"} disabled={!located} onClick={() => setView(v => v === "commute" ? "map" : "commute")}><Route data-icon="inline-start" />تحليل التنقل</Button></div>
    <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" disabled={!located} onClick={() => setView("analysis")}>تقييم الموقع ومقارنة الأحياء</Button>{propertyReference ? <Button variant="outline" size="sm" onClick={() => setView("property")}>الميزانية والمطابقة</Button> : null}</div>
    {view === "map" ? located ? <MapNearbyServices property={point} /> : <MadarMap label="موقع العقار" points={[point]} /> : <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground"><p>تُعرض التحليلات ونتائج Google مستقلة عن الخريطة.</p><Button size="sm" variant="outline" onClick={() => setView("map")}><MapPin data-icon="inline-start" />العودة إلى الخريطة</Button></div>}
    {view === "property" && propertyReference ? <PersonalPropertyInsights {...propertyReference} /> : located ? view === "commute" ? <CommutePanel latitude={point.latitude!} longitude={point.longitude!} /> : view === "analysis" ? <NeighborhoodAnalysisPanel initial={{ latitude: point.latitude!, longitude: point.longitude! }} /> : view === "services" ? <NearbyServices latitude={point.latitude!} longitude={point.longitude!} /> : <Button variant="link" className="self-start" onClick={() => setView("services")}>عرض قائمة خدمات Google المنفصلة</Button> : <p className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground">لا تتوفر إحداثيات صالحة لعرض الخدمات أو حساب التنقل لهذا العقار.</p>}
  </section>;
}
