import { z } from "zod";
import type { Property } from "./discovery-contracts";

export type ApiResponse = { message: string | null };
export type UserResponse = {
  id: number;
  fullName: string;
  email: string;
  createdAt: string | null;
};
export type CurrentHome = {
  id?: number | null;
  latitude: number;
  longitude: number;
  externalPropertyId?: string | null;
  source?: string | null;
  movedInAt?: string | null;
  confirmedByUserAt?: string | null;
};
export type HousingPreference = {
  id?: number | null;
  region: string;
  city: string;
  district?: string | null;
  maxBudget: number;
  occupantsCount: number | null;
  /** View-only active codes derived from the lifestyleInterests response. Never sent as housing input. */
  interests: string[];
  lifestyleInterests?: LifestyleInterest[];
  includeNearbyServices?: boolean | null;
  propertyType: string;
  listingType: "rent" | "sale";
  user?: UserResponse | null;
};
export type PlacePreference = {
  id?: number | null;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  importance: number;
  visitPerWeek: number;
};
export type SavedProperty = {
  id?: number | null;
  externalPropertyId: string;
  source: string;
  titleSnapshot?: string | null;
  titleSnapshotAr?: string | null;
  titleSnapshotEn?: string | null;
  savedAt?: string | null;
  available?: boolean;
  property?: Property | null;
};
export type PropertyComparison = {
  id?: number | null;
  firstPropertyId: string;
  secondPropertyId: string;
  firstPropertySource: string;
  secondPropertySource: string;
  createdAt?: string | null;
};

const requiredNumber = z.preprocess(
  (value) =>
    value === "" || (typeof value === "number" && Number.isNaN(value))
      ? undefined
      : value,
  z.number(),
);

export const placeSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.string().min(1).max(50),
  latitude: requiredNumber.pipe(z.number().min(-90).max(90)),
  longitude: requiredNumber.pipe(z.number().min(-180).max(180)),
  importance: requiredNumber.pipe(z.number().int().min(1).max(5)),
  visitPerWeek: requiredNumber.pipe(z.number().int()),
});
export const savedPropertySchema = z.object({
  externalPropertyId: z.string().min(1).max(150),
  source: z.string().min(1).max(50),
});
export const comparisonSchema = z
  .object({
    firstPropertyId: z.string().min(1).max(150),
    firstPropertySource: z.string().min(1).max(50),
    secondPropertyId: z.string().min(1).max(150),
    secondPropertySource: z.string().min(1).max(50),
  })
  .refine(
    (value) =>
      value.firstPropertyId !== value.secondPropertyId ||
      value.firstPropertySource !== value.secondPropertySource,
    {
      path: ["secondPropertyId"],
      message: "Choose two different listings.",
    },
  );
export const currentHomeSchema = z.object({
  latitude: requiredNumber.pipe(z.number().min(-90).max(90)),
  longitude: requiredNumber.pipe(z.number().min(-180).max(180)),
  externalPropertyId: z.string().max(150).nullable().optional(),
  source: z.string().max(50).nullable().optional(),
});
export const housingPreferenceSchema = z.object({
  region: z.string().min(1).max(100),
  city: z.string().regex(/^[a-z-]+$/),
  district: z.string().max(100).nullable().optional(),
  occupantsCount: requiredNumber.pipe(z.number().int().min(1).max(2147483647)),
  includeNearbyServices: z.boolean().nullable().optional(),
  maxBudget: requiredNumber.pipe(z.number().min(1)),
  propertyType: z.enum(["apartment", "villa", "floor", "duplex", "building"]),
  listingType: z.enum(["rent", "sale"]),
});
export type PlaceInput = z.infer<typeof placeSchema>;
export type SavedPropertyInput = z.infer<typeof savedPropertySchema>;
export type ComparisonInput = z.infer<typeof comparisonSchema>;
export type CurrentHomeInput = z.infer<typeof currentHomeSchema>;
export type HousingPreferenceInput = z.infer<typeof housingPreferenceSchema>;

export const accountSchema = z.object({
  fullName: z.string().min(3).max(100),
  email: z.email().max(100),
  password: z
    .string()
    .min(8)
    .max(64)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9\s])\S{8,64}$/),
});
export type AccountInput = z.infer<typeof accountSchema>;

export type HomeStatus = {
  status: "NO_HOME" | "HOME_SET" | "MOVED_IN";
  homeId: number | null;
  movedInAt: string | null;
};
export type ProfileCompletion = {
  completionPercentage: number;
  housingCompleted: boolean;
  placesCompleted: boolean;
  interestsCompleted: boolean;
  readyForSearch: boolean;
  missingFeatures: { feature: string; messageKey: string }[];
};
export type DashboardSummary = {
  userId: number;
  housingPreferencesCompleted: boolean;
  savedPropertiesCount: number;
  importantLocationsCount: number;
  currentHomeStatus: HomeStatus["status"];
};
export type SavedSummary = { totalSaved: number; countBySource: Record<string, number> };
export type PlacesSummary = { totalPlaces: number; countByType: Record<string, number> };

export const lifestyleInterestSchema = z.object({
  code: z.string().trim().min(1).max(60),
  active: z.boolean().nullable().optional(),
});
export type LifestyleInterestInput = z.infer<typeof lifestyleInterestSchema>;
export type LifestyleInterest = {
  id: number;
  code: string;
  active: boolean | null;
  category?: string;
  searchType?: string;
  googlePlaceType?: string | null;
  searchQuery?: string | null;
};
export type UserNotification = {
  id: number;
  title: string;
  message: string;
  type: string;
  referenceUrl: string | null;
  isRead: boolean;
  createdAt: string;
};
