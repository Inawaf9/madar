"use client";
import { useState } from "react";
import { useLocale } from "next-intl";
import { MapPin, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MadarMap } from "@/components/maps/madar-map";
import { validCoordinates, type MapPoint } from "@/lib/maps/points";
import { NearbyServices } from "@/features/properties/components/nearby-services";
import { CommutePanel } from "@/features/payments/commute-panel";
import { NeighborhoodAnalysisPanel } from "@/features/neighborhood/neighborhood-analysis";
import { PersonalPropertyInsights } from "@/features/properties/components/personal-property-insights";
import { MapNearbyServices } from "@/features/properties/map-nearby-services";

/** Geoapify POIs share the map; Google Places/Routes stay in separate views. */
export function PropertyLocationExperience({
  point,
  propertyReference,
}: {
  point: MapPoint;
  propertyReference?: { source: string; externalId: string };
}) {
  const ar = useLocale() === "ar";
  const [view, setView] = useState<"map" | "services" | "commute" | "analysis" | "home">(
    "map",
  );
  const located = validCoordinates(point.latitude, point.longitude);
  return (
    <section
      className="flex min-w-0 flex-col gap-5"
      aria-label={ar ? "الموقع والحياة اليومية" : "Location and daily life"}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-section font-medium">
            {ar ? "موقع البيت ومحيطه" : "Home location and surroundings"}
          </h2>
          <p className="mt-1 text-sm leading-7 text-muted-foreground">
            {ar
              ? "شوف موقع البيت والخدمات القريبة وخيارات المشاوير."
              : "See the home location, nearby services, and commute options."}
          </p>
        </div>
        <Button
          size="sm"
          variant={view === "commute" ? "secondary" : "outline"}
          aria-pressed={view === "commute"}
          disabled={!located}
          onClick={() => setView((v) => (v === "commute" ? "map" : "commute"))}
        >
          <Route data-icon="inline-start" />
          {ar ? "تحليل التنقل" : "Commute analysis"}
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!located}
          onClick={() => setView("analysis")}
        >
          {ar
            ? "تقييم الموقع ومقارنة الأحياء"
            : "Evaluate location and compare neighborhoods"}
        </Button>
        {propertyReference ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setView("home")}
          >
            {ar ? "الميزانية والمطابقة" : "Budget and match"}
          </Button>
        ) : null}
      </div>
      {view === "map" ? (
        located ? (
          <MapNearbyServices property={point} />
        ) : (
          <MadarMap
            label={ar ? "موقع البيت" : "Home location"}
            points={[point]}
          />
        )
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>
            {ar
              ? "التحليلات ونتائج Google تظهر في قائمة مستقلة عن الخريطة."
              : "Analysis and Google results appear separately from the map."}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setView("map")}
          >
            <MapPin data-icon="inline-start" />
            {ar ? "ارجع للخريطة" : "Back to map"}
          </Button>
        </div>
      )}
      {view === "home" && propertyReference ? (
        <PersonalPropertyInsights {...propertyReference} />
      ) : located ? (
        view === "commute" ? (
          <CommutePanel
            latitude={point.latitude!}
            longitude={point.longitude!}
          />
        ) : view === "analysis" ? (
          <NeighborhoodAnalysisPanel
            initial={{ latitude: point.latitude!, longitude: point.longitude! }}
          />
        ) : view === "services" ? (
          <NearbyServices
            latitude={point.latitude!}
            longitude={point.longitude!}
          />
        ) : (
          <Button
            variant="link"
            className="self-start"
            onClick={() => setView("services")}
          >
            {ar ? "شوف قائمة خدمات Google" : "View Google services list"}
          </Button>
        )
      ) : (
        <p className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground">
          {ar
            ? "موقع هذا البيت غير متاح، لذلك ما نقدر نعرض الخدمات أو نحسب المشاوير."
            : "This home has no valid location, so services and commute times are unavailable."}
        </p>
      )}
    </section>
  );
}
