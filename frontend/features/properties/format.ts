import type { Property } from "@/lib/api/discovery-contracts";
export const safeUrl = (value?: string | null) => { try { const url = new URL(value || ""); return ["http:", "https:"].includes(url.protocol) ? url.href : null; } catch { return null; } };
export const propertyHref = (property: Pick<Property, "source" | "externalId">) => `/properties/${encodeURIComponent(property.source)}/${encodeURIComponent(property.externalId || "")}`;
export function propertyPrice(p: Pick<Property, "price" | "pricePeriod">, locale: string) {
  if (p.price == null || !Number.isFinite(p.price)) return "السعر غير متاح";
  const suffix = p.pricePeriod === "yearly" ? " / سنويًا" : p.pricePeriod === "total" ? " — سعر البيع" : " — الفترة غير محددة";
  return `${new Intl.NumberFormat(locale).format(p.price)} ر.س${suffix}`;
}
