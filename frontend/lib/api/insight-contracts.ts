import { z } from "zod";
import type { CommuteReport, MatchSummary, PriceStats } from "./discovery-contracts";
export type Affordability = {
  externalId: string;
  propertyPrice: number;
  userBudget: number;
  priceDifference: number;
  differencePercentage: number;
  withinBudget: boolean;
};
export const weightsSchema = z
  .object({
    housingWeight: z.number().int().min(0).max(100),
    commuteWeight: z.number().int().min(0).max(100),
    servicesWeight: z.number().int().min(0).max(100),
  })
  .refine(
    (v) => v.housingWeight + v.commuteWeight + v.servicesWeight === 100,
    "يجب أن يكون مجموع الأوزان 100",
  );
export type RecommendationWeights = z.infer<typeof weightsSchema>;
export type MatchScore = {
  propertyId: string;
  source: string;
  title: string | null;
  matchScore: number;
  housingScore: number;
  commuteScore: number | null;
  servicesScore: number | null;
};
export type RecommendedProperty = MatchScore & {
  rank: number;
  city: string | null;
  neighborhood: string | null;
  price: number | null;
  bedrooms: number | null;
  areaSqm: number | null;
  image: string | null;
  listingUrl: string | null;
  aiReason: string | null;
  aiTradeOff: string | null;
};
export type SmartRecommendations = { recommendations: RecommendedProperty[] };
export const smartRecommendationsSchema = z
  .object({
    recommendations: z.array(
      z.object({
        rank: z.number().int(),
        propertyId: z.string(),
        source: z.string(),
        title: z.string().nullable(),
        city: z.string().nullable(),
        neighborhood: z.string().nullable(),
        price: z.number().int().nullable(),
        bedrooms: z.number().int().nullable(),
        areaSqm: z.number().nullable(),
        image: z.string().nullable(),
        listingUrl: z.string().nullable(),
        matchScore: z.number(),
        housingScore: z.number(),
        commuteScore: z.number().nullable(),
        servicesScore: z.number().nullable(),
        aiReason: z.string().nullable(),
        aiTradeOff: z.string().nullable(),
      }),
    ),
  })
  .transform((result) => result satisfies SmartRecommendations);
export type ComputedProperty = {
  savedPropertyId: number | null;
  externalPropertyId: string;
  source: string;
  title: string | null;
  neighborhood: string | null;
  price: number | null;
  bedrooms: number | null;
  areaSqm: number | null;
  image: string | null;
  listingUrl: string | null;
  matchScore: number;
  housingScore: number;
  commuteScore: number | null;
  servicesScore: number | null;
};
export type ComputedComparison = {
  properties: ComputedProperty[];
  aiAnalysis: {
    recommendedSavedPropertyId: number | null;
    recommendedExternalPropertyId: string | null;
    recommendedPropertyTitle: string | null;
    reason: string | null;
    alternativeReason: string | null;
    tradeOff: string | null;
  } | null;
};
export const neighborhoodInputSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  district: z.string().optional(),
});
export type NeighborhoodInput = z.infer<typeof neighborhoodInputSchema>;
export type NeighborhoodSuitability = {
  district: string | null;
  neighborhoodScore: number;
  commuteScore: number | null;
  servicesScore: number | null;
  servicesAvailable: boolean;
  commuteAnalysis: CommuteReport | null;
  aiAnalysis: string | null;
};
export type NeighborhoodComparison = {
  firstNeighborhood: NeighborhoodSuitability;
  secondNeighborhood: NeighborhoodSuitability;
  betterNeighborhood: "FIRST" | "SECOND" | "TIE";
  scoreDifference: number;
};
export type AiExplanation = {
  title: string | null;
  summary: string | null;
  highlights: string[];
  advice: string | null;
  budgetPosition: string | null;
  generatedByAi: boolean;
  matchSummary: MatchSummary;
  marketStats: PriceStats;
};

export type NeighborhoodSuggestions = {
  city: string | null;
  coverageNote: string | null;
  aiAnalysis: string | null;
  neighborhoods: {
    rank: number;
    district: string;
    latitude: number;
    longitude: number;
    sampledPropertyCount: number;
    lowestSampledPrice: number | null;
    housingScore: number | null;
    matchScore: number | null;
    suitability: NeighborhoodSuitability;
  }[];
};
