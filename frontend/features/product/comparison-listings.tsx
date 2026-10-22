"use client";
import { useQueries } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { discovery } from "@/lib/api/discovery";
import type { PropertyComparison } from "@/lib/api/contracts";
import { propertyPrice, propertyHref } from "@/features/properties/format";
import { Link } from "@/i18n/navigation";
import { ErrorState, Loading } from "./shared";
export function ComparisonListings({ pair }: { pair: PropertyComparison }) {
  const locale = useLocale(); const references = [[pair.firstPropertySource, pair.firstPropertyId], [pair.secondPropertySource, pair.secondPropertyId]];
  const queries = useQueries({ queries: references.map(([source, id]) => ({ queryKey: ["property", source, id], queryFn: ({ signal }: { signal: AbortSignal }) => discovery.detail(source, id, signal), retry: false, enabled: !!source && !!id && id !== "null" })) });
  return <div className="grid gap-5 md:grid-cols-2">{queries.map((query, index) => <article key={index} className="flex flex-col gap-3 rounded-2xl border bg-card p-5">{!references[index][1] || references[index][1] === "null" ? <p>مرجع الإعلان غير صالح.</p> : query.isPending ? <Loading /> : query.isError ? <><p className="text-sm text-muted-foreground">قد يكون الإعلان منتهيًا أو غير متاح؛ يبقى المرجع المحفوظ كما هو.</p><ErrorState error={query.error} retry={() => void query.refetch()} /></> : query.data ? <><h3 className="break-words font-bold"><bdi>{query.data.title || "عنوان غير متاح"}</bdi></h3><p>{propertyPrice(query.data, locale)}</p><dl className="grid grid-cols-2 gap-2 text-sm"><dt>غرف النوم</dt><dd>{query.data.bedrooms ?? "—"}</dd><dt>الحمامات</dt><dd>{query.data.bathrooms ?? "—"}</dd><dt>المساحة م²</dt><dd>{query.data.areaSqm ?? "—"}</dd><dt>الحي</dt><dd>{query.data.neighborhood || "—"}</dd></dl><p className="text-xs text-muted-foreground">المصدر: {query.data.sourceName || query.data.source}</p><Link href={propertyHref(query.data)} className="text-sm underline">تفاصيل الإعلان الفعلية</Link></> : null}</article>)}</div>;
}
