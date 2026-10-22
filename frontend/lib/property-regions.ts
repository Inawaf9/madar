/** Geography is independent of provider coverage and of the six brand identities. */
export type RegionalIdentity = "najdi" | "coastal" | "highlands" | "oasis" | "rose" | "northern";
export const regionalAccents: Record<RegionalIdentity, string> = {
  najdi: "var(--region-riyadh)", coastal: "var(--region-jeddah)",
  highlands: "var(--region-abha)", oasis: "var(--region-ahsa)",
  rose: "var(--region-alula)", northern: "var(--region-tabuk)",
};

const administrativeRegions = [
  { id: "riyadh", ar: "منطقة الرياض", en: "Riyadh Region", identity: "najdi" },
  { id: "makkah", ar: "منطقة مكة المكرمة", en: "Makkah Region", identity: "coastal" },
  { id: "asir", ar: "منطقة عسير", en: "Asir Region", identity: "highlands" },
  { id: "eastern", ar: "المنطقة الشرقية", en: "Eastern Province", identity: "oasis" },
  { id: "madinah", ar: "منطقة المدينة المنورة", en: "Madinah Region", identity: "rose" },
  { id: "tabuk", ar: "منطقة تبوك", en: "Tabuk Region", identity: "northern" },
  // No arbitrary assignment of the six reference colors to the remaining regions.
  { id: "qassim", ar: "منطقة القصيم", en: "Qassim Region", identity: null },
  { id: "hail", ar: "منطقة حائل", en: "Hail Region", identity: null },
  { id: "northern-borders", ar: "منطقة الحدود الشمالية", en: "Northern Borders Region", identity: null },
  { id: "jazan", ar: "منطقة جازان", en: "Jazan Region", identity: null },
  { id: "najran", ar: "منطقة نجران", en: "Najran Region", identity: null },
  { id: "al-bahah", ar: "منطقة الباحة", en: "Al Bahah Region", identity: null },
  { id: "al-jawf", ar: "منطقة الجوف", en: "Al Jawf Region", identity: null },
] as const;
export type RegionId = typeof administrativeRegions[number]["id"];

export type DiscoveryCity = {
  id: string;
  ar: string;
  en: string;
  regionId: RegionId;
  /** Null means no documented native API slug; never offer it for live search. */
  apiSlug: string | null;
  support: "documented" | "unverified";
  aliases: readonly string[];
};

// The public search examples document only riyadh and jeddah. These are not
// runtime coverage guarantees. Add slugs only after documentation/verification.
export const discoveryCities: readonly DiscoveryCity[] = [
  { id: "riyadh", ar: "الرياض", en: "Riyadh", regionId: "riyadh", apiSlug: "riyadh", support: "documented", aliases: [] },
  { id: "jeddah", ar: "جدة", en: "Jeddah", regionId: "makkah", apiSlug: "jeddah", support: "documented", aliases: [] },
  { id: "abha", ar: "أبها", en: "Abha", regionId: "asir", apiSlug: null, support: "unverified", aliases: [] },
  { id: "al-ahsa", ar: "الأحساء", en: "Al-Ahsa", regionId: "eastern", apiSlug: null, support: "unverified", aliases: ["Al Ahsa", "Al_Ahsa"] },
  { id: "alula", ar: "العلا", en: "AlUla", regionId: "madinah", apiSlug: null, support: "unverified", aliases: ["Al Ula", "Al-Ula", "Al_Ula"] },
  { id: "tabuk", ar: "تبوك", en: "Tabuk", regionId: "tabuk", apiSlug: null, support: "unverified", aliases: [] },
];

export type DiscoveryRegion = {
  id: RegionId; ar: string; en: string; identity: RegionalIdentity | null;
  accentColor: string; supportedCities: readonly DiscoveryCity[];
};
export const discoveryRegions: readonly DiscoveryRegion[] = administrativeRegions.map(region => ({
  ...region,
  accentColor: region.identity ? regionalAccents[region.identity] : "var(--muted-foreground)",
  supportedCities: discoveryCities.filter(city => city.regionId === region.id && city.apiSlug && city.support === "documented"),
}));

export function supportedSearchCity(slug: string | null | undefined) {
  return discoveryCities.find(city => city.apiSlug === slug && city.support === "documented");
}

function normalizeCity(value: string) {
  return value.normalize("NFKC").trim().toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا").replace(/\s+/g, " ");
}
const cityNames = new Map(discoveryCities.flatMap(city =>
  [city.ar, city.en, ...city.aliases, ...(city.apiSlug ? [city.apiSlug] : [])]
    .map(name => [normalizeCity(name), city] as const)));

/** Exact normalized city matches only; never infer from the active search filter. */
export function propertyRegion(cityName: string | null | undefined) {
  if (!cityName) return undefined;
  const city = cityNames.get(normalizeCity(cityName));
  return city ? discoveryRegions.find(region => region.id === city.regionId) : undefined;
}
