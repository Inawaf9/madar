import type { GooglePlace } from "@/lib/api/discovery-contracts";

export const categoryLabels: Record<string, string> = {
  supermarket: "سوبرماركت", hospital: "مستشفى", pharmacy: "صيدلية", park: "حديقة",
  gym: "نادي رياضي", cafe: "مقهى", restaurant: "مطعم", school: "مدرسة", shopping_mall: "مركز تسوق",
};
export function categoryLabel(category: string | null | undefined) {
  return category ? categoryLabels[category] || category : "تصنيف غير متاح";
}
export function placeCategory(place: GooglePlace) {
  return categoryLabel(place.primaryType || place.types?.[0]);
}
/** Format backend measurements used by neighborhood / essential-interest lists. */
export function straightLineDistance(meters: number | null | undefined) {
  if (typeof meters !== "number" || !Number.isFinite(meters) || meters < 0) return "المسافة غير متاحة من المصدر";
  const format = new Intl.NumberFormat("ar-SA", { maximumFractionDigits: meters >= 1000 ? 1 : 0 });
  return `${format.format(meters >= 1000 ? meters / 1000 : meters)} ${meters >= 1000 ? "كم" : "متر"} بخط مستقيم`;
}
