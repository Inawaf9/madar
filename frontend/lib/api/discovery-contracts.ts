import { z } from "zod";

export const propertyTypes = [
  "all",
  "apartment",
  "villa",
  "floor",
  "duplex",
  "building",
  "office",
  "shop",
  "warehouse",
  "land",
] as const;
export const sorts = [
  "newest",
  "updated_desc",
  "updated_asc",
  "price_asc",
  "price_desc",
  "price_drop",
  "days_on_market_desc",
  "recommended",
  "price",
  "price-desc",
  "price-drop",
] as const;
const optionalNumber = (max: number, integer = true, min = 0) =>
  z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    (integer ? z.number().int() : z.number()).min(min).max(max).optional(),
  );
export const searchSchema = z
  .object({
    city: z.string().regex(/^[a-z_]+$/, "اختر مدينة برمز إنجليزي صحيح"),
    purpose: z.enum(["rent", "sale"]).default("rent"),
    q: z
      .string()
      .min(2)
      .max(120)
      .refine((value) => value.trim().length > 0, "كلمة البحث لا يمكن أن تكون مسافات فقط")
      .optional(),
    type: z.enum(propertyTypes).optional(),
    neighborhoodId: optionalNumber(2147483647, true, 1),
    minPrice: optionalNumber(2000000000),
    maxPrice: optionalNumber(2000000000),
    minArea: optionalNumber(10000000, false),
    maxArea: optionalNumber(10000000, false),
    minBedrooms: optionalNumber(20),
    minBathrooms: optionalNumber(20),
    furnished: z.enum(["true", "false"]).optional(),
    rentFrequency: z.enum(["monthly", "yearly"]).optional(),
    sort: z.enum(sorts).default("newest"),
    limit: optionalNumber(100, true, 1),
    lang: z.preprocess(
      (value) => (typeof value === "string" ? value.toLowerCase() : value),
      z.enum(["ar", "en"]).optional(),
    ),
    cursor: z.string().min(1).max(500).optional(),
  })
  .superRefine((v, ctx) => {
    for (const [min, max] of [
      ["minPrice", "maxPrice"],
      ["minArea", "maxArea"],
    ] as const) {
      if (v[min] != null && v[max] != null && v[min]! > v[max]!)
        ctx.addIssue({
          code: "custom",
          path: [max],
          message: "الحد الأعلى يجب ألا يقل عن الحد الأدنى",
        });
    }
    if (v.purpose === "sale" && v.rentFrequency)
      ctx.addIssue({
        code: "custom",
        path: ["rentFrequency"],
        message: "دورية الإيجار لا تنطبق على البيع",
      });
  });
export type SearchFilters = z.output<typeof searchSchema>;
export const searchKeys = Object.keys(searchSchema.shape);
export function parseSearch(params: URLSearchParams) {
  const raw: Record<string, string> = {};
  for (const key of searchKeys) {
    if (params.getAll(key).length > 1)
      return { success: false as const, message: "أحد فلاتر الرابط مكرر؛ عدّل البحث" };
    const value = params.get(key);
    if (value != null && value !== "") raw[key] = value;
  }
  const parsed = searchSchema.safeParse(raw);
  return parsed.success
    ? parsed
    : {
        success: false as const,
        message: /[\u0600-\u06ff]/.test(parsed.error.issues[0]?.message || "")
          ? parsed.error.issues[0].message
          : "خيارات الرابط غير صحيحة؛ راجع حدود الفلاتر والقيم المقبولة",
      };
}

export type Property = {
  externalId: string | null;
  source: string;
  sourceName: string | null;
  title: string | null;
  originalTitle: string | null;
  titleAr?: string | null;
  titleEn?: string | null;
  cityName: string | null;
  cityNameAr?: string | null;
  cityNameEn?: string | null;
  listingUrl: string | null;
  city: string | null;
  neighborhood: string | null;
  neighborhoodAr?: string | null;
  neighborhoodNameEn?: string | null;
  propertyType: string | null;
  listingType: string | null;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqm: number | null;
  latitude: number | null;
  longitude: number | null;
  image: string | null;
  images: string[] | null;
  updatedAt: string | null;
  distanceKm: number | null;
  description: string | null;
  pricePeriod: "yearly" | "total" | null;
  postedPrice: number | null;
  postedPricePeriod: string | null;
  sourceUrl: string | null;
  neighborhoodId: number | null;
};
export type SearchResponse = {
  data: Property[];
  pagination: {
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
    resultWindowReached: boolean;
  };
};
export type MatchSummary = {
  budget: number;
  totalListings: number;
  inMyDistrict: number | null;
  cheapestPrice: number | null;
};
export type PriceStats = {
  city: string;
  listingType: string;
  propertyType: string;
  totalListings: number;
  minPrice: number | null;
  maxPrice: number | null;
};
export const categories = [
  "supermarket",
  "hospital",
  "pharmacy",
  "park",
  "gym",
  "cafe",
  "restaurant",
  "school",
  "shopping_mall",
] as const;
export type GooglePlace = {
  id: string | null;
  displayName: { text: string | null } | null;
  formattedAddress: string | null;
  location: { latitude: number | null; longitude: number | null } | null;
  primaryType: string | null;
  types: string[] | null;
  /** Set by Spring after filtering Google Places results to the requested radius. */
  distanceKm?: number | null;
};
export type PlacesResponse = { places: (GooglePlace | null)[] | null };
export type NearbyPlace = { place: GooglePlace; straightLineDistanceMeters: number };
export type EssentialResult = {
  category: string;
  status: "FOUND" | "NO_MATCH" | "SEARCH_FAILED";
  found: boolean;
  place: GooglePlace | null;
  straightLineDistanceMeters: number | null;
};
export type CommuteReport = {
  commutes: {
    placePreferenceId: number;
    placeName: string;
    placeType: string;
    importance: number;
    visitPerWeek: number;
    distanceKm: number | null;
    durationMinutes: number | null;
  }[];
  totalWeeklyMinutes: number | null;
  totalWeeklyHours: number | null;
  commuteScore: number | null;
};
export type Checkout = {
  paymentId: number;
  serviceType: string;
  amount: number;
  currency: string;
  intentId: string;
  clientSecret: string;
  expiresAt: string;
  givenId: string;
  metadata: Record<string, string>;
};
export type Payment = {
  id: number;
  serviceType: string;
  amount: number;
  currency: string | null;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  createdAt: string;
  paidAt: string | null;
  accessExpiresAt: string | null;
  refundedAmount: number | null;
};
export type FeatureAccess = {
  serviceType: string;
  access: boolean;
  expiresAt: string | null;
};
