"use client";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { useProperty } from "./hooks";
import { discovery } from "@/lib/api/discovery";
import { ErrorState, PageHeading } from "@/features/product/shared";
import { DetailSkeleton } from "./skeletons";
import { ListingImage, PropertyActions, PropertyCard } from "./property-card";
import { propertyPrice, safeUrl } from "./format";
import { GoogleMap, validCoordinates } from "@/components/maps/google-map";
import { NearbyServices } from "./nearby-services";
import { CommutePanel } from "@/features/payments/commute-panel";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PropertyDetailPage({ source, externalId }: { source: string; externalId: string }) {
  const query = useProperty(source, externalId); const locale = useLocale(); const [showSimilar, setShowSimilar] = useState(false); const [activeImage, setActiveImage] = useState<string | null>(null);
  const similar = useQuery({ queryKey: ["similar", source, externalId], queryFn: ({ signal }) => discovery.similar(source, externalId, signal), enabled: showSimilar && query.isSuccess, retry: false });
  if (!source || !externalId || ["null", "undefined"].includes(externalId)) return <p>معرّف الإعلان غير متاح؛ يبقى المرجع المحفوظ قابلًا للإدارة.</p>;
  if (query.isPending) return <DetailSkeleton />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  const p = query.data; const title = p.title || "تفاصيل العقار"; const url = safeUrl(p.listingUrl); const sourceUrl = safeUrl(p.sourceUrl);
  const located = validCoordinates(p.latitude, p.longitude);
  const images = Array.from(new Set([p.image, ...(p.images || [])].map(safeUrl).filter((image): image is string => !!image)));
  const selectedImage = activeImage && images.includes(activeImage) ? activeImage : images[0] || null;
  return <div className="flex flex-col gap-8">
    <PageHeading title={title} description={[p.city, p.neighborhood].filter(Boolean).join(" · ") || "الموقع غير متاح"} />
    <div className="grid items-start gap-8 lg:grid-cols-2"><div className="flex flex-col gap-3"><div className="overflow-hidden rounded-3xl border"><ListingImage key={selectedImage} src={selectedImage} title={title} priority /></div>{images.length > 1 ? <div className="flex flex-wrap gap-2" aria-label="صور الإعلان">{images.map((image, i) => <Button key={image} size="sm" variant={selectedImage === image ? "secondary" : "outline"} aria-pressed={selectedImage === image} onClick={() => setActiveImage(image)}>صورة {i + 1}</Button>)}</div> : null}</div>
      <div className="flex flex-col gap-5 rounded-3xl border bg-card p-6 shadow-stone"><p className="text-2xl font-bold text-primary"><bdi>{propertyPrice(p, locale)}</bdi></p>
        {p.postedPrice != null ? <p className="text-sm text-muted-foreground">السعر كما نُشر: <bdi>{new Intl.NumberFormat(locale).format(p.postedPrice)} ر.س · {p.postedPricePeriod || "الدورية غير محددة"}</bdi></p> : null}
        <dl className="grid grid-cols-2 gap-3 text-sm">{[["غرف النوم", p.bedrooms], ["الحمامات", p.bathrooms], ["المساحة م²", p.areaSqm], ["النوع", p.propertyType]].map(([label, value]) => <div key={String(label)}><dt className="text-muted-foreground">{label}</dt><dd className="mt-1"><bdi>{value ?? "غير متاح"}</bdi></dd></div>)}</dl>
        <p className="whitespace-pre-line break-words text-sm leading-8">{p.description || "لا يوجد وصف متاح من المصدر."}</p><PropertyActions property={p} />
        <p className="text-xs text-muted-foreground">المصدر: {p.sourceName || p.source}{sourceUrl ? <> · <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">موقع المصدر</a></> : null}</p>
        {url ? <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">افتح الإعلان الأصلي</a> : null}
      </div>
    </div>
    <GoogleMap label="موقع العقار" points={[{ id: `${source}:${externalId}`, title, latitude: p.latitude, longitude: p.longitude }]} />
    {located ? <><NearbyServices latitude={p.latitude!} longitude={p.longitude!} /><CommutePanel latitude={p.latitude!} longitude={p.longitude!} /></> : <p className="text-sm text-muted-foreground">لا تتوفر إحداثيات صالحة لعرض الخدمات أو حساب التنقل.</p>}
    <Button variant="outline" onClick={() => setShowSimilar(v => !v)}>{showSimilar ? "إخفاء الخيارات المشابهة" : "خيارات مشابهة"}</Button>
    {showSimilar ? similar.isPending ? <p role="status">جارٍ تحميل الخيارات…</p> : similar.isError ? <ErrorState error={similar.error} retry={() => void similar.refetch()} /> : similar.data?.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{similar.data.map((item, i) => <PropertyCard key={`${item.source}:${item.externalId || i}`} property={item} />)}</div> : <p>لا توجد خيارات مشابهة لدى المزوّد.</p> : null}
  </div>;
}
