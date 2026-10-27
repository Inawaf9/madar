import type { GooglePlace } from "@/lib/api/discovery-contracts";
import { validCoordinates } from "./points";

const EARTH_RADIUS_METERS = 6_371_000;
const radians = (degrees: number) => (degrees * Math.PI) / 180;
const validDistance = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

/** Always derive an ephemeral spherical distance from property/place coordinates.
 * Backend distance fields are deliberately ignored.
 * No Google-derived value from this helper is passed to the map renderer.
 */
export function nearbyPlaceDistanceMeters(
  latitude: number | null,
  longitude: number | null,
  place: GooglePlace,
): number | null {
  const location = place.location;
  return haversineDistanceMeters(
    latitude,
    longitude,
    location?.latitude ?? null,
    location?.longitude ?? null,
  );
}

export function haversineDistanceMeters(
  latitude: number | null,
  longitude: number | null,
  destinationLatitude: number | null,
  destinationLongitude: number | null,
): number | null {
  if (
    !validCoordinates(latitude, longitude) ||
    !validCoordinates(destinationLatitude, destinationLongitude)
  )
    return null;
  const fromLatitude = radians(latitude!);
  const toLatitude = radians(destinationLatitude!);
  const deltaLatitude = toLatitude - fromLatitude;
  const deltaLongitude = radians(destinationLongitude! - longitude!);
  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(deltaLongitude / 2) ** 2;
  // Rounding near antipodal/coincident points must not produce NaN.
  const clamped = Math.min(1, Math.max(0, a));
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(clamped), Math.sqrt(1 - clamped));
}

export function propertyDistanceLabel(meters: number | null, locale: string): string {
  if (!validDistance(meters))
    return locale === "ar" ? "المسافة غير متاحة" : "Distance unavailable";
  const kilometers = meters >= 1000;
  const number = new Intl.NumberFormat(locale, {
    minimumFractionDigits: kilometers ? 1 : 0,
    maximumFractionDigits: kilometers ? 1 : 0,
  });
  return `${number.format(kilometers ? meters / 1000 : meters)} ${kilometers ? (locale === "ar" ? "كم" : "km") : locale === "ar" ? "م" : "m"} ${locale === "ar" ? "عن العقار" : "from property"}`;
}
