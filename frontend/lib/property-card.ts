import type { Property } from "@/lib/api/discovery-contracts";
import { safeUrl } from "@/lib/safe-url";

/** Display data only. IDs, API mutations and navigation stay with each caller. */
export type PropertyCardData = {
  title: string; image: string | null; location: string | null;
  price: number | null; pricePeriod: Property["pricePeriod"]; listingType: string | null;
  bedrooms: number | null; bathrooms: number | null; areaSqm: number | null;
};

export function propertyCardData(property: Partial<Property> | undefined, fallbackTitle: string): PropertyCardData {
  return {
    title: property?.title?.trim() || fallbackTitle,
    image: [property?.image, ...(property?.images || [])].map(safeUrl).find(Boolean) || null,
    location: [property?.cityName || property?.city, property?.neighborhood].filter(Boolean).join(" · ") || null,
    price: property?.price ?? null, pricePeriod: property?.pricePeriod ?? null,
    listingType: property?.listingType ?? null, bedrooms: property?.bedrooms ?? null,
    bathrooms: property?.bathrooms ?? null, areaSqm: property?.areaSqm ?? null,
  };
}
