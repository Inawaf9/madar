import type { ChatProperty } from "@/lib/api/chat";
import type { Property } from "@/lib/api/discovery-contracts";
import { propertyCardData } from "@/lib/property-card";

/** Preserve the raw DTO in the message; adapt only the presentation fields. */
export function adaptChatProperty(dto: ChatProperty, locale: string) {
  const ar = locale === "ar";
  const first = (...values: (string | null)[]) =>
    values.find((value) => value?.trim()) || null;
  const pricePeriod: Property["pricePeriod"] =
    dto.pricePeriod === "yearly" || dto.pricePeriod === "total" ? dto.pricePeriod : null;
  const localized = {
    ...dto,
    title: first(
      ar ? dto.titleAr : dto.titleEn,
      dto.title,
      ar ? dto.titleEn : dto.titleAr,
      dto.originalTitle,
    ),
    cityName: first(ar ? dto.cityNameAr : dto.cityNameEn, dto.cityName, dto.city),
    neighborhood: first(
      ar ? dto.neighborhoodAr : dto.neighborhoodNameEn,
      dto.neighborhood,
    ),
    description: first(ar ? dto.descriptionAr : dto.descriptionTextEn, dto.description),
    pricePeriod,
  };
  const reference =
    dto.source?.trim() &&
    dto.externalId?.trim() &&
    !["null", "undefined"].includes(dto.externalId.trim().toLowerCase()) &&
    !["null", "undefined"].includes(dto.source.trim().toLowerCase());
  // A missing source never becomes KITE or a fabricated navigable identifier.
  const property: Property | null = reference
    ? { ...localized, source: dto.source! }
    : null;
  return {
    listing: propertyCardData(
      { ...localized, source: dto.source || undefined },
      ar ? "بيت بدون عنوان" : "Untitled home",
    ),
    property,
  };
}
