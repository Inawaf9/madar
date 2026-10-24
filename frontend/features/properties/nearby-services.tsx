"use client";
import { QueryFeedback } from "@/components/product/query-feedback";
import { ListSkeleton } from "@/components/product/page-skeleton";
import { useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { discovery } from "@/lib/api/discovery";
import { categories } from "@/lib/api/discovery-contracts";
import { GoogleDataAttribution } from "@/components/maps/google-data-attribution";
import { categoryLabel, placeCategory } from "@/lib/maps/place-presentation";
import { nearbyPlaceDistanceMeters, propertyDistanceLabel } from "@/lib/maps/nearby-distance";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import { MapPin, Search } from "lucide-react";

type Category = typeof categories[number];
export function NearbyServices({ latitude, longitude, showResults = true, onShowResults }: { latitude: number; longitude: number; showResults?: boolean; onShowResults?: () => void }) {
  const [category, setCategory] = useState<Category>("supermarket");
  const [request, setRequest] = useState<Category | null>(null);
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const locale = useLocale();
  const query = useQuery({ queryKey: ["nearby-services", latitude, longitude, request], queryFn: ({ signal }) => discovery.nearby(latitude, longitude, request!, 2000, signal), enabled: request !== null && showResults, retry: false });
  const places = (query.data?.places?.filter(p => p != null) || [])
    .map(place => ({ place, distanceMeters: nearbyPlaceDistanceMeters(latitude, longitude, place) }))
    .sort((a, b) => {
      if (a.distanceMeters === null) return b.distanceMeters === null ? 0 : 1;
      if (b.distanceMeters === null) return -1;
      return a.distanceMeters - b.distanceMeters;
    });
  const search = (next: Category) => {
    setCategory(next); setExpanded(false);
    if (request === next && showResults) { if (!query.isFetching) void query.refetch(); }
    else setRequest(next);
    onShowResults?.();
  };
  return <section aria-labelledby={`${id}-heading`} className="flex min-w-0 flex-col gap-4 border-t pt-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id={`${id}-heading`} className="text-section font-medium">الخدمات القريبة</h2><p className="mt-1 text-xs leading-6 text-muted-foreground">اختر تصنيفًا لاستعراض خدمات ضمن نطاق كيلومترين في قائمة مستقلة عن الخريطة.</p></div><Button variant="outline" size="sm" disabled={showResults && query.isFetching} onClick={() => search(category)}><Search data-icon="inline-start" />{showResults && query.isFetching ? "جارٍ البحث…" : "عرض الخدمات"}</Button></div>
    <div role="group" aria-label="تصنيف الخدمات القريبة" className="flex min-w-0 gap-2 overflow-x-auto pb-2">
      {categories.map(c => <Button type="button" key={c} size="sm" variant={category === c ? "secondary" : "outline"} aria-pressed={category === c} className={cn("shrink-0 rounded-full", category === c && "border border-primary/30 font-semibold")} onClick={() => search(c)}>{categoryLabel(c)}</Button>)}
    </div>
    {showResults ? <div className="flex flex-col gap-4">
      <QueryFeedback query={query} />
      {request && query.isPending ? <ListSkeleton kind="services" /> : query.isError && !query.data ? <ErrorState error={query.error} retry={() => void query.refetch()} retryDisabled={query.isFetching} /> : request && query.data ? <>
        <div className="flex flex-col gap-1"><p className="text-xs text-muted-foreground">{categoryLabel(request)} · {places.length} من النتائج المتاحة</p><p id={`${id}-distance-method`} className="text-xs leading-6 text-muted-foreground">المسافات تقديرية بخط مستقيم، محسوبة بمعادلة Haversine من إحداثيات العقار إلى كل مكان؛ وليست مسافات مشي أو قيادة.</p></div>
        {places.length ? <ul className="grid gap-3 sm:grid-cols-2">{(expanded ? places : places.slice(0, 4)).map(({ place: p, distanceMeters }, i) => <li key={p.id || i} className="flex min-w-0 items-start gap-3 rounded-2xl border bg-card p-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-primary"><MapPin aria-hidden="true" className="size-4" /></span><div className="min-w-0 flex-1"><h3 dir="auto" className="break-words text-start text-sm font-semibold">{p.displayName?.text || "مكان بدون اسم"}</h3><div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"><p className="text-xs text-muted-foreground">{placeCategory(p)}</p><p aria-describedby={`${id}-distance-method`} className="text-xs font-medium leading-6 text-primary"><bdi>{propertyDistanceLabel(distanceMeters, locale)}</bdi></p></div>
          {p.formattedAddress ? <details className="mt-2"><summary className="cursor-pointer rounded text-xs font-medium text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring">تفاصيل المكان</summary><p dir="auto" className="mt-2 break-words text-start text-xs leading-6 text-muted-foreground">{p.formattedAddress}</p></details> : null}</div>
        </li>)}</ul> : <EmptyState title="لا توجد خدمات مطابقة" description="لم يُرجع المزوّد نتائج لهذا التصنيف ضمن نطاق البحث. جرّب تصنيفًا آخر." />}
        {places.length > 4 ? <Button type="button" className="self-center" variant="outline" onClick={() => setExpanded(v => !v)} aria-expanded={expanded}>{expanded ? "عرض أقل" : `عرض المزيد من الخدمات (${places.length - 4})`}</Button> : null}
        <GoogleDataAttribution />
      </> : <p className="rounded-2xl border bg-card p-4 text-sm leading-7 text-muted-foreground">اختر تصنيفًا أو اضغط «عرض الخدمات» لبدء البحث. لا تُحسب أوقات القيادة في هذا العرض.</p>}
    </div> : null}
  </section>;
}
