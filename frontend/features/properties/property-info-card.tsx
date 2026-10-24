"use client";
import { safeUrl } from "@/lib/safe-url";
import { PropertyPrice } from "@/components/property/property-card-view";
import { useLocale } from "next-intl";
import { ExternalLink } from "lucide-react";
import type { Property } from "@/lib/api/discovery-contracts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PropertyActions } from "./property-card";
import { PropertyFacts } from "./property-facts";
import { listingTypeLabel, propertyTypeLabel } from "./format";
import { PropertyDescription } from "./property-description";

export function PropertyInfoCard({ property: p }: { property: Property }) {
  const locale = useLocale();
  const listingUrl = safeUrl(p.listingUrl);
  const sourceUrl = safeUrl(p.sourceUrl);
  const type = propertyTypeLabel(p.propertyType);
  const purpose = listingTypeLabel(p.listingType);
  return <section aria-label="معلومات العقار" className="flex min-h-0 min-w-0 flex-col gap-5 rounded-2xl border border-border/70 bg-card p-5 shadow-panel sm:p-6">
    <div className="flex flex-wrap gap-2">{purpose ? <Badge variant="secondary">{purpose}</Badge> : null}{type ? <Badge variant="outline">{type}</Badge> : null}</div>
    <div><h2 className="mb-2 text-xs text-muted-foreground">السعر المطلوب</h2><PropertyPrice price={p.price} pricePeriod={p.pricePeriod} />
      {p.postedPrice != null ? <p className="mt-2 text-xs leading-6 text-muted-foreground">{Number.isSafeInteger(p.postedPrice) ? <>السعر كما نُشر: <bdi>{new Intl.NumberFormat(locale).format(p.postedPrice)} ر.س · {p.postedPricePeriod || "الدورية غير محددة"}</bdi></> : "تعذّر عرض السعر كما نُشر بدقة؛ راجع الإعلان الأصلي."}</p> : null}
    </div>
    <div className="border-y py-5"><PropertyFacts property={p} locale={locale} detailed /></div>
    {p.originalTitle && p.originalTitle !== p.title ? <details className="min-w-0 text-xs text-muted-foreground"><summary className="cursor-pointer">العنوان الأصلي لدى المزوّد</summary><p dir="auto" className="mt-2 break-words text-start leading-6">{p.originalTitle}</p></details> : null}
    <PropertyDescription key={p.description || "missing"} description={p.description} />
    <div className="flex flex-col gap-3 border-t pt-5">
      {listingUrl ? <Button nativeButton={false} variant="outline" render={<a href={listingUrl} target="_blank" rel="noopener noreferrer" />}>الإعلان الأصلي<ExternalLink data-icon="inline-end" /></Button> : null}
      <PropertyActions property={p} />
      <p className="text-xs leading-6 text-muted-foreground">المصدر: <bdi>{p.sourceName || p.source}</bdi>{sourceUrl ? <> · <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">موقع المصدر</a></> : null}</p>
    </div>
  </section>;
}
