import { apiRequest } from "./client";
import type { EssentialResult } from "./discovery-contracts";
import { serializeQuery } from "./query";
import { weightsSchema, type RecommendationWeights, type MatchScore, type SmartRecommendations, type ComputedComparison, type NeighborhoodInput, type NeighborhoodSuitability, type NeighborhoodComparison, type Affordability, type AiExplanation } from "./insight-contracts";
import { type ApiLanguage } from "./config";
const enc = encodeURIComponent;
const languageHeaders = (language: ApiLanguage) => ({ "Accept-Language": language });
export const insights = {
  propertyInterests: (id: number, source: string, externalId: string, signal?: AbortSignal) => apiRequest<EssentialResult[]>(`/api/v1/properties/nearby-interests/${id}/${enc(source)}/${enc(externalId)}?radius=2000`, { signal }),
  affordability: (id: number, source: string, externalId: string, signal?: AbortSignal) => apiRequest<Affordability>(`/api/v1/properties/affordability/${id}?${serializeQuery({ source, externalId })}`, { signal }),
  match: (id: number, source: string, externalId: string, weights?: RecommendationWeights, signal?: AbortSignal) => apiRequest<MatchScore>(`/api/v1/recommendations/match-score/${id}?${serializeQuery({ source, externalId })}`, { method: "POST", body: weights ? weightsSchema.parse(weights) : undefined, signal }),
  smart: (id: number, language: ApiLanguage, weights?: RecommendationWeights, signal?: AbortSignal) => apiRequest<SmartRecommendations>(`/api/v1/recommendations/smart/${id}`, { method: "POST", body: weights ? weightsSchema.parse(weights) : undefined, headers: languageHeaders(language), signal }),
  compareTwo: (id: number, firstSource: string, firstId: string, secondSource: string, secondId: string, language: ApiLanguage, signal?: AbortSignal) => apiRequest<ComputedComparison>(`/api/v1/property-comparison/compare-two/${id}/${enc(firstSource)}/${enc(firstId)}/${enc(secondSource)}/${enc(secondId)}`, { headers: languageHeaders(language), signal }),
  compareMultiple: (id: number, savedIds: number[], language: ApiLanguage, signal?: AbortSignal) => apiRequest<ComputedComparison>(`/api/v1/property-comparison/compare-multiple/${id}/${savedIds.join(",")}`, { headers: languageHeaders(language), signal }),
  neighborhood: (id: number, input: NeighborhoodInput, language: ApiLanguage, signal?: AbortSignal) => apiRequest<NeighborhoodSuitability>(`/api/v1/recommendations/neighborhood-suitability/${id}?${serializeQuery(input)}`, { headers: languageHeaders(language), signal }),
  compareNeighborhoods: (id: number, first: NeighborhoodInput, second: NeighborhoodInput, language: ApiLanguage, signal?: AbortSignal) => apiRequest<NeighborhoodComparison>(`/api/v1/recommendations/compare-neighborhoods/${id}?${new URLSearchParams({ firstLatitude: String(first.latitude), firstLongitude: String(first.longitude), firstDistrict: first.district ?? "", secondLatitude: String(second.latitude), secondLongitude: String(second.longitude), secondDistrict: second.district ?? "" })}`, { headers: languageHeaders(language), signal }),
  explanation: (id: number, signal?: AbortSignal) => apiRequest<AiExplanation>(`/api/v1/ai/explain-match/${id}`, { signal }),
};
