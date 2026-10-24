"use client";
import { getProductCopy } from "./presentation-copy";
import { QueryFeedback } from "@/components/product/query-feedback";
import { ListingSummarySkeleton } from "@/components/product/page-skeleton";
import { useQueries } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { apiLanguage } from "@/lib/api/config";
import { discovery } from "@/lib/api/discovery";
import type { PropertyComparison } from "@/lib/api/contracts";
import { propertyHref } from "@/features/properties/format";
import { Link } from "@/i18n/navigation";
import { PropertyCardView } from "@/components/property/property-card-view";
import { propertyCardData } from "@/lib/property-card";
import { ErrorState } from "@/components/shared/error-state";
export function ComparisonListings({ pair }: { pair: PropertyComparison }) {
  const locale = useLocale(); const text = getProductCopy(locale); const ar = locale === "ar"; const references = [[pair.firstPropertySource, pair.firstPropertyId], [pair.secondPropertySource, pair.secondPropertyId]];
  const queries = useQueries({ queries: references.map(([source, id]) => ({ queryKey: ["property", source, id, apiLanguage(locale)], queryFn: ({ signal }: { signal: AbortSignal }) => discovery.detail(source, id, signal, apiLanguage(locale)), retry: false, enabled: !!source && !!id && !["null", "undefined"].includes(id) })) });
  return <div className="grid gap-5 md:grid-cols-2">{queries.map((query, index) => <article key={index} className="flex min-w-0 flex-col gap-3"><QueryFeedback query={query} />{!references[index][0] || !references[index][1] || ["null", "undefined"].includes(references[index][1]) ? <p>مرجع الإعلان غير صالح.</p> : query.isPending ? <ListingSummarySkeleton /> : query.isError && !query.data ? <><p className="text-sm text-muted-foreground">قد يكون الإعلان منتهيًا أو غير متاح؛ يبقى المرجع المحفوظ كما هو.</p><ErrorState error={query.error} retry={() => void query.refetch()} /></> : query.data ? <PropertyCardView listing={propertyCardData(query.data, text.untitled)} href={propertyHref(query.data)} metadata={<p className="text-caption text-muted-foreground">{ar ? "المصدر" : "Source"}: <bdi>{query.data.sourceName || query.data.source}</bdi></p>} footer={<Link href={propertyHref(query.data)} className="text-sm font-medium text-primary underline underline-offset-4">{text.propertyDetails}</Link>} /> : null}</article>)}</div>;
}
