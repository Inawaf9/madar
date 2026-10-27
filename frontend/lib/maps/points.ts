/** Frontend rendering contract, deliberately separate from backend DTOs.
 * Google Places/Routes content must never enter the non-Google map boundary.
 */
import type { PoiCategory } from "./poi";
export type MapPoint = {
  id: string;
  title: string;
  latitude: number | null;
  longitude: number | null;
  description?: string | null;
  provenance: "listing" | "user" | "geoapify";
  kind: "property" | "home" | "destination" | "service";
  category?: PoiCategory;
  distanceMeters?: number | null;
  details?: string | null;
};
export function validCoordinates(latitude: unknown, longitude: unknown): boolean {
  return (
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    typeof longitude === "number" &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180
  );
}
export function renderablePoints(points: readonly MapPoint[]) {
  return Array.from(
    new Map(
      points
        .filter(
          (point) =>
            (point.provenance === "listing" || point.provenance === "user"
              ? point.kind !== "service"
              : point.provenance === "geoapify" && point.kind === "service") &&
            validCoordinates(point.latitude, point.longitude),
        )
        .map((point) => [point.id, point]),
    ).values(),
  );
}
