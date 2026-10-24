import type { QueryClient } from "@tanstack/react-query";
const userRoots = new Set(["profile", "current-home", "home-status", "housing-preference", "places", "saved-properties", "comparisons", "profile-completion", "dashboard-summary", "saved-summary", "saved-check", "places-summary", "recommendations", "match-summary", "smart", "match-score", "computed-comparison", "affordability", "neighborhood", "neighborhood-search", "neighborhood-analysis", "ai-explanation", "property-interests"]);
export function invalidateUserData(cache: QueryClient, userId: number) {
  return cache.invalidateQueries({ predicate: query => query.queryKey[1] === userId && userRoots.has(String(query.queryKey[0])) });
}
