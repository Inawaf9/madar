"use client";
import { useQuery } from "@tanstack/react-query";
import { getMapPois } from "@/lib/api/map-poi";
import { haversineDistanceMeters } from "@/lib/maps/nearby-distance";
import { POI_RADIUS_METERS, type PoiCategory } from "@/lib/maps/poi";

/** Shared cache identity and distance ordering for the map and assistant preview. */
export function useMapPois(latitude: number | null, longitude: number | null, category: PoiCategory | null, enabled = category !== null) {
  const query = useQuery({ queryKey: ["map-poi", latitude, longitude, category], queryFn: ({ signal }) => getMapPois(latitude!, longitude!, category!, signal), enabled, staleTime: 300_000, retry: false });
  const places = (query.data?.places || []).filter(place => place.category === category)
    .map(place => ({ ...place, distance: haversineDistanceMeters(latitude, longitude, place.latitude, place.longitude) }))
    .filter(place => place.distance !== null && place.distance <= POI_RADIUS_METERS)
    .sort((a, b) => a.distance! - b.distance!);
  return { query, places };
}
