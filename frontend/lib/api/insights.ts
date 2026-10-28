import { apiRequest } from "./client";
import { ApiError } from "./errors";
import type { ApiResponse } from "./contracts";
import type { EssentialResult } from "./discovery-contracts";
import { serializeQuery } from "./query";
import {
  weightsSchema,
  type RecommendationWeights,
  type MatchScore,
  type SmartRecommendations,
  smartRecommendationsSchema,
  type ComputedComparison,
  type NeighborhoodInput,
  type NeighborhoodSuitability,
  type NeighborhoodComparison,
  type NeighborhoodSuggestions,
  type Affordability,
  type AiExplanation,
} from "./insight-contracts";
import { type ApiLanguage } from "./config";
import { compareSavedPropertiesPath } from "./comparison-request-paths";
const enc = encodeURIComponent;
const languageHeaders = (language: ApiLanguage) => ({ "Accept-Language": language });
export const insights = {
  propertyInterests: (source: string, externalId: string, signal?: AbortSignal) =>
    apiRequest<EssentialResult[]>(
      `/api/v1/properties/me/nearby-interests/${enc(source)}/${enc(externalId)}?radius=2000`,
      { signal },
    ),
  affordability: (source: string, externalId: string, signal?: AbortSignal) =>
    apiRequest<Affordability>(
      `/api/v1/properties/me/affordability?${serializeQuery({ source, externalId })}`,
      { signal },
    ),
  match: (
    source: string,
    externalId: string,
    weights?: RecommendationWeights,
    signal?: AbortSignal,
  ) =>
    apiRequest<MatchScore>(
      `/api/v1/recommendations/me/match-score?${serializeQuery({ source, externalId })}`,
      {
        method: "POST",
        body: weights ? weightsSchema.parse(weights) : undefined,
        signal,
      },
    ),
  smart: async (
    language: ApiLanguage,
    weights?: RecommendationWeights,
    signal?: AbortSignal,
  ): Promise<SmartRecommendations> => {
    const result = await apiRequest<unknown>("/api/v1/recommendations/me/smart", {
      method: "POST",
      body: weights ? weightsSchema.parse(weights) : undefined,
      headers: languageHeaders(language),
      signal,
    });
    const parsed = smartRecommendationsSchema.safeParse(result);
    if (!parsed.success) {
      if (process.env.NODE_ENV !== "production") {
        console.error(
          "[smart-search:response-validation-failed]",
          parsed.error.issues.map(({ code, path }) => ({ code, path })),
        );
      }
      throw new ApiError("Invalid Smart Search response", 502);
    }
    return parsed.data;
  },
  compareTwo: (
    firstSource: string,
    firstId: string,
    secondSource: string,
    secondId: string,
    language: ApiLanguage,
    signal?: AbortSignal,
  ) =>
    apiRequest<ComputedComparison>(
      `/api/v1/property-comparison/me/compare-two/${enc(firstSource)}/${enc(firstId)}/${enc(secondSource)}/${enc(secondId)}`,
      { headers: languageHeaders(language), signal },
    ),
  compareMultiple: (savedIds: number[], language: ApiLanguage, signal?: AbortSignal) =>
    apiRequest<ComputedComparison>(compareSavedPropertiesPath(savedIds), {
      headers: languageHeaders(language),
      signal,
    }),
  neighborhood: (input: NeighborhoodInput, language: ApiLanguage, signal?: AbortSignal) =>
    apiRequest<NeighborhoodSuitability>(
      `/api/v1/recommendations/me/neighborhood-suitability?${serializeQuery(input)}`,
      { headers: languageHeaders(language), signal },
    ),
  compareNeighborhoods: (
    first: NeighborhoodInput,
    second: NeighborhoodInput,
    language: ApiLanguage,
    signal?: AbortSignal,
  ) =>
    apiRequest<NeighborhoodComparison>(
      `/api/v1/recommendations/me/compare-neighborhoods?${new URLSearchParams({ firstLatitude: String(first.latitude), firstLongitude: String(first.longitude), firstDistrict: first.district ?? "", secondLatitude: String(second.latitude), secondLongitude: String(second.longitude), secondDistrict: second.district ?? "" })}`,
      { headers: languageHeaders(language), signal },
    ),
  suggestNeighborhoods: (
    language: ApiLanguage,
    weights?: RecommendationWeights,
    signal?: AbortSignal,
  ) =>
    apiRequest<NeighborhoodSuggestions>(
      "/api/v1/recommendations/me/suggest-neighborhoods",
      {
        method: "POST",
        body: weights ? weightsSchema.parse(weights) : undefined,
        headers: languageHeaders(language),
        signal,
      },
    ),
  selectNeighborhood: (district: string) =>
    apiRequest<ApiResponse>("/api/v1/recommendations/me/selected-neighborhood", {
      method: "PUT",
      body: { district: district.trim() },
    }),
  selectedNeighborhoodProperties: (
    language: ApiLanguage,
    weights?: RecommendationWeights,
    signal?: AbortSignal,
  ) =>
    apiRequest<SmartRecommendations>(
      "/api/v1/recommendations/me/selected-neighborhood-properties",
      {
        method: "POST",
        body: weights ? weightsSchema.parse(weights) : undefined,
        headers: languageHeaders(language),
        signal,
      },
    ),
  explanation: (signal?: AbortSignal) =>
    apiRequest<AiExplanation>(`/api/v1/ai/explain-match`, { signal }),
};
