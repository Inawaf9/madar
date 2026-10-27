import type { Property } from "@/lib/api/discovery-contracts";
export const propertyHref = (property: Pick<Property, "source" | "externalId">) =>
  `/properties/${encodeURIComponent(property.source)}/${encodeURIComponent(property.externalId || "")}`;
const propertyTypeLabels: Record<string, string> = {
  all: "جميع الأنواع",
  apartment: "شقة",
  villa: "فيلا",
  floor: "دور",
  duplex: "دوبلكس",
  building: "عمارة",
  office: "مكتب",
  shop: "محل",
  warehouse: "مستودع",
  land: "أرض",
};
export function propertyTypeLabel(value: string | null | undefined) {
  return value ? propertyTypeLabels[value.toLowerCase()] || value : null;
}
const listingTypeLabels: Record<string, string> = { rent: "للإيجار", sale: "للبيع" };
export function listingTypeLabel(value: string | null | undefined) {
  return value ? listingTypeLabels[value.toLowerCase()] || value : null;
}
