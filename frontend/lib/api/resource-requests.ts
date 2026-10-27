import {
  currentHomeSchema,
  housingPreferenceSchema,
  lifestyleInterestSchema,
  placeSchema,
  savedPropertySchema,
  comparisonSchema,
  type CurrentHomeInput,
  type HousingPreferenceInput,
  type LifestyleInterestInput,
  type PlaceInput,
  type SavedPropertyInput,
  type ComparisonInput,
} from "./contracts";

// Never spread fetched entities into writes. Each builder intentionally enumerates the strict DTO.
export function currentHomeRequest(value: CurrentHomeInput) {
  return currentHomeSchema.parse({
    latitude: value.latitude,
    longitude: value.longitude,
    externalPropertyId: value.externalPropertyId,
    source: value.source,
  });
}
export function housingPreferenceRequest(value: HousingPreferenceInput) {
  return housingPreferenceSchema.parse({
    region: value.region,
    city: value.city,
    district: value.district,
    maxBudget: value.maxBudget,
    occupantsCount: value.occupantsCount,
    propertyType: value.propertyType,
    listingType: value.listingType,
    includeNearbyServices: value.includeNearbyServices,
  });
}
export function lifestyleInterestRequest(value: LifestyleInterestInput) {
  return lifestyleInterestSchema.parse({ code: value.code, active: value.active });
}
export function placePreferenceRequest(value: PlaceInput) {
  return placeSchema.parse({
    name: value.name,
    type: value.type,
    latitude: value.latitude,
    longitude: value.longitude,
    importance: value.importance,
    visitPerWeek: value.visitPerWeek,
  });
}
export function savedPropertyRequest(value: SavedPropertyInput) {
  return savedPropertySchema.parse({
    externalPropertyId: value.externalPropertyId,
    source: value.source,
  });
}
export function propertyComparisonRequest(value: ComparisonInput) {
  return comparisonSchema.parse({
    firstPropertyId: value.firstPropertyId,
    secondPropertyId: value.secondPropertyId,
    firstPropertySource: value.firstPropertySource,
    secondPropertySource: value.secondPropertySource,
  });
}
