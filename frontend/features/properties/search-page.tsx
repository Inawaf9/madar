"use client";
import { useSearchParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { discovery } from "@/lib/api/discovery";
import { parseSearch, serializeQuery } from "@/lib/api/discovery-contracts";
import { SearchForm } from "./search-form";
import { PropertyCard } from "./property-card";
import { PropertyGridSkeleton } from "./skeletons";
import { ErrorState, EmptyState, PageHeading } from "@/features/product/shared";
import { Button } from "@/components/ui/button";

export function PropertySearchPage() {
  const params = useSearchParams(); const serialized = params.toString();
  const parsed = parseSearch(new URLSearchParams(serialized));
  const filters = parsed.success ? parsed.data : undefined;
  const result = useInfiniteQuery({
    queryKey: ["property-search", filters ? serializeQuery(filters) : serialized],
    initialPageParam: filters?.cursor,
    queryFn: ({ pageParam, signal }) => discovery.search({ ...filters!, cursor: pageParam }, signal),
    enabled: !!filters, staleTime: 60_000, refetchOnMount: false,
    getNextPageParam: (page, _pages, _last, previous) => {
      const p = page.pagination;
      return p.hasMore && !p.resultWindowReached && p.nextCursor && !previous.includes(p.nextCursor) ? p.nextCursor : undefined;
    }, retry: false,
  });
  const unique = new Set<string>();
  const properties = result.data?.pages.flatMap(page => page.data).filter((p, index) => { const key = p.externalId ? `${p.source}:${p.externalId}` : `missing:${index}`; if (unique.has(key)) return false; unique.add(key); return true; }) || [];
  const last = result.data?.pages.at(-1);
  return <div className="flex flex-col gap-8">
    <PageHeading title="اكتشف بيتًا يناسب حياتك" description="تصفح العقارات دون تسجيل. اختر مدينة وحدّد احتياجاتك، ثم احفظ خياراتك إن رغبت." />
    <SearchForm key={serialized} initial={Object.fromEntries(params)} />
    {!params.get("city") ? <EmptyState title="اختر مدينة لبدء البحث" description="لا نختار موقعًا نيابةً عنك. الاستكشاف العام لا يتطلب ملفًا شخصيًا." /> : !parsed.success ? <p role="alert" className="rounded-2xl border border-destructive p-5 text-destructive">{parsed.message}</p> : result.isPending ? <PropertyGridSkeleton /> : <>
      {result.isError ? <ErrorState error={result.error} retry={() => void result.refetch()} /> : null}
      {!result.isError && !properties.length ? <EmptyState title="لا توجد نتائج مطابقة" description="جرّب تعديل الميزانية أو نوع العقار أو الفلاتر الأخرى." /> : null}
      {properties.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{properties.map((property, index) => <PropertyCard key={`${property.source}:${property.externalId || index}`} property={property} />)}</div> : null}
      {result.isFetchingNextPage ? <p role="status">جارٍ تحميل دفعة إضافية…</p> : null}
      {result.hasNextPage ? <Button size="lg" disabled={result.isFetching} onClick={() => { if (!result.isFetching) void result.fetchNextPage(); }}>تحميل المزيد</Button> : null}
      {last?.pagination.resultWindowReached ? <p className="text-sm text-muted-foreground">وصلت إلى حد نافذة نتائج المزوّد. ضيّق نطاق البحث لرؤية خيارات أخرى.</p> : null}
      {last && !result.hasNextPage && properties.length ? <p className="text-xs text-muted-foreground">انتهت النتائج المتاحة لهذا البحث؛ لا يعني ذلك حصر جميع الإعلانات.</p> : null}
    </>}
  </div>;
}
