import type { GooglePlace } from "@/lib/api/discovery-contracts";

export const categoryLabels: Record<string, string> = {
  supermarket: "سوبرماركت",
  hospital: "مستشفى",
  pharmacy: "صيدلية",
  park: "حديقة",
  gym: "نادي رياضي",
  cafe: "مقهى",
  restaurant: "مطعم",
  school: "مدرسة",
  shopping_mall: "مركز تسوق",
};
const englishCategoryLabels: Record<string, string> = {
  supermarket: "Supermarket",
  hospital: "Hospital",
  pharmacy: "Pharmacy",
  park: "Park",
  gym: "Gym",
  cafe: "Café",
  restaurant: "Restaurant",
  school: "School",
  shopping_mall: "Shopping mall",
};
export function categoryLabel(category: string | null | undefined, locale = "ar") {
  return category
    ? (locale === "ar" ? categoryLabels : englishCategoryLabels)[category] || category
    : locale === "ar"
      ? "تصنيف غير متاح"
      : "Category unavailable";
}
export function placeCategory(place: GooglePlace, locale = "ar") {
  return categoryLabel(place.primaryType || place.types?.[0], locale);
}
/** Format backend measurements used by neighborhood / essential-interest lists. */
export function straightLineDistance(meters: number | null | undefined, locale = "ar") {
  if (typeof meters !== "number" || !Number.isFinite(meters) || meters < 0)
    return locale === "ar"
      ? "المسافة غير متاحة من المصدر"
      : "Distance unavailable from source";
  const format = new Intl.NumberFormat(locale, {
    maximumFractionDigits: meters >= 1000 ? 1 : 0,
  });
  const amount = `${format.format(meters >= 1000 ? meters / 1000 : meters)} ${meters >= 1000 ? (locale === "ar" ? "كم" : "km") : locale === "ar" ? "متر" : "m"}`;
  return locale === "ar"
    ? `المسافة التقريبية بخط مستقيم: ${amount}`
    : `Approximate straight-line distance: ${amount}`;
}
