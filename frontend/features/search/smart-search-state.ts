export type SearchMode = "normal" | "smart";

export function initialSearchMode(
  requestedMode: string | null,
  hasSearchFilters: boolean,
): SearchMode | null {
  if (requestedMode === "smart") return "smart";
  if (requestedMode === "normal" || hasSearchFilters) return "normal";
  return null;
}

/** The server's readiness flag is authoritative; places and interests are optional. */
export function smartSearchReady(
  completion: { readyForSearch: boolean } | undefined,
  housing: unknown,
): boolean {
  return completion?.readyForSearch === true && housing != null;
}

/** Spring requires a positive sum before it can calculate a commute score. */
export function hasUsableCommuteWeights(
  places: readonly { importance: number; visitPerWeek: number }[],
): boolean {
  return (
    places.length === 0 ||
    places.reduce((total, place) => total + place.importance * place.visitPerWeek, 0) > 0
  );
}
