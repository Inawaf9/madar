"use client";
import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { useLocale } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, House } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocalUserId } from "@/features/product/local-user";
import { useSaved, keys } from "@/features/account/api/hooks";
import { ErrorState } from "@/features/product/shared";
import { api } from "@/lib/api/endpoints";
import type { Property } from "@/lib/api/discovery-contracts";
import { propertyHref, propertyPrice, safeUrl } from "./format";
import { propertyRegion } from "@/lib/property-regions";

export function PropertyActions({ property }: { property: Property }) {
  const userId = useLocalUserId(); const saved = useSaved(userId); const cache = useQueryClient();
  const existing = saved.data?.find(p => p.externalPropertyId === property.externalId && p.source.toUpperCase() === property.source.toUpperCase());
  const valid = !!property.externalId && !["null", "undefined"].includes(property.externalId);
  const mutation = useMutation({ mutationFn: async () => {
    if (!userId || !valid) return;
    if (existing?.id) await api.savedProperties.remove(userId, existing.id);
    else await api.savedProperties.add(userId, { externalPropertyId: property.externalId!, source: property.source, titleSnapshot: property.title?.slice(0, 200) || undefined });
  }, onSuccess: () => cache.invalidateQueries({ queryKey: keys.saved(userId!) }) });
  if (!userId) return <Button nativeButton={false} render={<Link href="/login" />} variant="outline"><Heart data-icon="inline-start" />اختر ملفك المحلي للحفظ</Button>;
  return <div className="flex w-full flex-col gap-3">
    <div className="flex flex-wrap gap-2"><Button variant={existing ? "secondary" : "outline"} aria-pressed={!!existing} disabled={!valid || saved.isPending || saved.isError || mutation.isPending} onClick={() => mutation.mutate()}><Heart data-icon="inline-start" className={existing ? "fill-current" : undefined} />{mutation.isPending ? "جارٍ الحفظ…" : existing ? "إزالة من المحفوظات" : "حفظ العقار"}</Button>{existing?.id ? <Button nativeButton={false} render={<Link href={`/compare?first=${existing.id}`} />} variant="outline">قارن مع عقار محفوظ</Button> : null}</div>
    {saved.isError ? <ErrorState error={saved.error} retry={() => void saved.refetch()} /> : null}
    {mutation.isError ? <ErrorState error={mutation.error} /> : null}
    {mutation.isSuccess ? <p role="status" className="text-xs text-primary">تم تحديث المحفوظات لدى الخادم.</p> : null}
  </div>;
}
export function ListingImage({ src, title, priority = false }: { src: string | null; title: string; priority?: boolean }) {
  const [failed, setFailed] = useState(false); const image = safeUrl(src);
  return <div className="relative aspect-[4/3] overflow-hidden bg-secondary">{image && !failed ? <Image src={image} alt={title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" unoptimized preload={priority} onError={() => setFailed(true)} className="object-cover" /> : <div className="flex h-full items-center justify-center gap-2 text-muted-foreground"><House /><span>الصورة غير متاحة</span></div>}</div>;
}
export function PropertyCard({ property }: { property: Property }) {
  const locale = useLocale(); const title = property.title?.trim() || "عقار بدون عنوان";
  const valid = !!property.externalId && !["null", "undefined"].includes(property.externalId);
  const region = propertyRegion(property.city);
  return <Card style={region ? { "--property-accent": region.accentColor } as CSSProperties : undefined}
    className={`min-w-0 pt-0 transition-[box-shadow,border-color,translate] duration-200 motion-reduce:transition-none ${region
      ? "border-[color:color-mix(in_srgb,var(--property-accent)_var(--regional-border-strength),var(--border))] shadow-[0_12px_32px_color-mix(in_srgb,var(--property-accent)_var(--regional-shadow-strength),transparent)] hover:border-[color:color-mix(in_srgb,var(--property-accent)_var(--regional-hover-border-strength),var(--border))] hover:shadow-[0_18px_40px_color-mix(in_srgb,var(--property-accent)_var(--regional-hover-shadow-strength),transparent)] motion-safe:hover:-translate-y-0.5"
      : "hover:border-primary/40"}`}>
    <ListingImage src={property.image || property.images?.[0] || null} title={title} />
    <CardHeader><CardTitle><h3 className="break-words leading-7"><bdi>{title}</bdi></h3></CardTitle><CardDescription className="break-words"><bdi>{[property.city, property.neighborhood].filter(Boolean).join(" · ") || "الموقع غير متاح"}</bdi></CardDescription>
      {region ? <p className="flex items-center gap-2 text-xs text-muted-foreground"><span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-(--property-accent) dark:opacity-70" />{locale === "ar" ? region.ar : region.en}</p> : null}
    </CardHeader>
    <CardContent className="flex flex-col gap-3"><p className="text-lg font-bold text-primary"><bdi>{propertyPrice(property, locale)}</bdi></p><p className="flex flex-wrap gap-3 text-xs text-muted-foreground"><span>{property.bedrooms ?? "—"} غرف نوم</span><span>{property.bathrooms ?? "—"} حمامات</span><span><bdi>{property.areaSqm ?? "—"} م²</bdi></span></p><p className="text-xs text-muted-foreground">المصدر: {property.sourceName || property.source}</p></CardContent>
    <CardFooter className="mt-auto flex-col items-stretch gap-3">{valid ? <Button nativeButton={false} render={<Link href={propertyHref(property)} />}>عرض التفاصيل</Button> : <p className="text-xs text-muted-foreground">معرّف الإعلان غير متاح</p>}<PropertyActions property={property} /></CardFooter>
  </Card>;
}
