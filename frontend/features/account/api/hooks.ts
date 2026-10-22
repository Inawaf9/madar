"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CurrentHomeInput, HousingPreferenceInput, PlaceInput, SavedPropertyInput, ComparisonInput } from "@/lib/api/contracts";
import { api } from "@/lib/api/endpoints";

export const keys = {
  profile: (id: number) => ["profile", id] as const,
  home: (id: number) => ["current-home", id] as const,
  housing: (id: number) => ["housing-preference", id] as const,
  places: (id: number) => ["places", id] as const,
  saved: (id: number) => ["saved-properties", id] as const,
  comparisons: (id: number) => ["comparisons", id] as const,
};

export function useProfile(userId: number | null) {
  return useQuery({ queryKey: ["profile", userId], queryFn: ({ signal }) => api.profile.get(userId as number, signal), enabled: userId !== null });
}
export function useHome(userId: number | null) {
  return useQuery({ queryKey: ["current-home", userId], queryFn: ({ signal }) => api.home.get(userId as number, signal), enabled: userId !== null });
}
export function useHousing(userId: number | null) {
  return useQuery({ queryKey: ["housing-preference", userId], queryFn: ({ signal }) => api.preferences.get(userId as number, signal), enabled: userId !== null });
}
export function usePlaces(userId: number | null) {
  return useQuery({ queryKey: ["places", userId], queryFn: ({ signal }) => api.places.get(userId as number, signal), enabled: userId !== null });
}
export function useSaved(userId: number | null) {
  return useQuery({ queryKey: ["saved-properties", userId], queryFn: ({ signal }) => api.savedProperties.get(userId as number, signal), enabled: userId !== null });
}
export function useComparisons(userId: number | null) {
  return useQuery({ queryKey: ["comparisons", userId], queryFn: ({ signal }) => api.comparisons.get(userId as number, signal), enabled: userId !== null });
}

function useRefresh() {
  const queryClient = useQueryClient();
  return (key: readonly unknown[]) => queryClient.invalidateQueries({ queryKey: key });
}
export function useAccountWrite<T>(userId: number, key: readonly unknown[], request: (id: number, input: T) => Promise<unknown>) {
  const invalidate = useRefresh();
  return useMutation({ mutationFn: (input: T) => request(userId, input), onSuccess: () => invalidate(key) });
}
export function useAccountEdit<T>(userId: number, key: readonly unknown[], request: (id: number, recordId: number, input: T) => Promise<unknown>) {
  const invalidate = useRefresh();
  return useMutation({ mutationFn: ({ recordId, input }: { recordId: number; input: T }) => request(userId, recordId, input), onSuccess: () => invalidate(key) });
}
export function useAccountDelete(userId: number, key: readonly unknown[], request: (id: number, recordId: number) => Promise<unknown>) {
  const invalidate = useRefresh();
  return useMutation({ mutationFn: (recordId: number) => request(userId, recordId), onSuccess: () => invalidate(key) });
}

export const accountDataApi = {
  homeCreate: (id: number, value: CurrentHomeInput) => api.home.add(id, value),
  homeUpdate: (id: number, recordId: number, value: CurrentHomeInput) => api.home.update(id, recordId, value),
  homeDelete: (id: number, recordId: number) => api.home.remove(id, recordId),
  housingCreate: (id: number, value: HousingPreferenceInput) => api.preferences.add(id, value),
  housingUpdate: (id: number, recordId: number, value: HousingPreferenceInput) => api.preferences.update(id, recordId, value),
  housingDelete: (id: number, recordId: number) => api.preferences.remove(id, recordId),
  placeCreate: (id: number, value: PlaceInput) => api.places.add(id, value),
  placeUpdate: (id: number, recordId: number, value: PlaceInput) => api.places.update(id, recordId, value),
  placeDelete: (id: number, recordId: number) => api.places.remove(id, recordId),
  placeImportance: (id: number, recordId: number, importance: number) => api.places.importance(id, recordId, importance),
  savedCreate: (id: number, value: SavedPropertyInput) => api.savedProperties.add(id, value),
  savedDelete: (id: number, recordId: number) => api.savedProperties.remove(id, recordId),
  comparisonCreate: (id: number, value: ComparisonInput) => api.comparisons.add(id, value),
  comparisonDelete: (id: number, recordId: number) => api.comparisons.remove(id, recordId),
};
