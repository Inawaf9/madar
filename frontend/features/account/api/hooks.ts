"use client";

import { useQuery } from "@tanstack/react-query";
import { profileApi } from "@/lib/api/account";
import { homeApi } from "@/lib/api/current-home";
import { preferencesApi } from "@/lib/api/preferences";
import { placesApi } from "@/lib/api/places";
import { savedPropertiesApi } from "@/lib/api/saved-properties";
import { comparisonsApi } from "@/lib/api/comparisons";

export const keys = {
  profile: (id: number | null) => ["profile", id] as const,
  home: (id: number | null) => ["current-home", id] as const,
  housing: (id: number | null) => ["housing-preference", id] as const,
  places: (id: number | null) => ["places", id] as const,
  saved: (id: number | null) => ["saved-properties", id] as const,
  comparisons: (id: number | null) => ["comparisons", id] as const,
};

export function useProfile(userId: number | null) {
  return useQuery({ queryKey: keys.profile(userId), queryFn: ({ signal }) => profileApi.get(userId as number, signal), enabled: userId !== null });
}
export function useHome(userId: number | null) {
  return useQuery({ queryKey: keys.home(userId), queryFn: ({ signal }) => homeApi.get(userId as number, signal), enabled: userId !== null });
}
export function useHousing(userId: number | null) {
  return useQuery({ queryKey: keys.housing(userId), queryFn: ({ signal }) => preferencesApi.get(userId as number, signal), enabled: userId !== null });
}
export function usePlaces(userId: number | null) {
  return useQuery({ queryKey: keys.places(userId), queryFn: ({ signal }) => placesApi.get(userId as number, signal), enabled: userId !== null });
}
export function useSaved(userId: number | null) {
  return useQuery({ queryKey: keys.saved(userId), queryFn: ({ signal }) => savedPropertiesApi.get(userId as number, signal), enabled: userId !== null });
}
export function useComparisons(userId: number | null) {
  return useQuery({ queryKey: keys.comparisons(userId), queryFn: ({ signal }) => comparisonsApi.get(userId as number, signal), enabled: userId !== null });
}

export function useHomeStatus(userId: number | null) {
  return useQuery({ queryKey: ["home-status", userId], queryFn: ({ signal }) => homeApi.status(userId!, signal), enabled: userId !== null, retry: false });
}
export function useProfileCompletion(userId: number) {
  return useQuery({ queryKey: ["profile-completion", userId], queryFn: ({ signal }) => profileApi.completion(userId, signal), retry: false });
}
export function useDashboardSummary(userId: number) {
  return useQuery({ queryKey: ["dashboard-summary", userId], queryFn: ({ signal }) => profileApi.dashboard(userId, signal), retry: false });
}
