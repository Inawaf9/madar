"use client";
import { useLocale } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowUpLeft, Columns3, Heart, LoaderCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { useLocalUserId } from "@/features/account/use-local-user-id";
import { useSaved } from "@/features/account/api/hooks";
import { ErrorState } from "@/components/shared/error-state";
import { invalidateUserData } from "@/features/account/api/invalidation";
import { savedPropertiesApi } from "@/lib/api/saved-properties";
import type { Property } from "@/lib/api/discovery-contracts";
import { propertyHref, propertyTypeLabel } from "./format";
import { PropertyCardView } from "@/components/property/property-card-view";
import { propertyCardData } from "@/lib/property-card";
import { rememberPropertyOrigin } from "./property-navigation";

export function PropertyActions({ property, compact = false, overlay = false }: { property: Property; compact?: boolean; overlay?: boolean }) {
  const userId = useLocalUserId(); const saved = useSaved(userId); const cache = useQueryClient();
  const existing = saved.data?.find(p => p.externalPropertyId === property.externalId && p.source.toUpperCase() === property.source.toUpperCase());
  const valid = !!property.externalId && !["null", "undefined"].includes(property.externalId);
  const mutation = useMutation({ mutationFn: async () => {
    if (!userId || !valid) return;
    if (existing?.id) await savedPropertiesApi.remove(userId, existing.id);
    else await savedPropertiesApi.add(userId, { externalPropertyId: property.externalId!, source: property.source, titleSnapshot: property.title?.slice(0, 200) || undefined });
  }, onSuccess: () => invalidateUserData(cache, userId!), onError: () => { if (overlay) toast.error("تعذّر تحديث المحفوظات. حاول مجددًا."); } });
  if (overlay) {
    if (!userId) return <Button nativeButton={false} render={<Link href="/login" />} variant="outline" size="icon" className="size-10 rounded-full bg-card/95 focus-visible:ring-ring" aria-label="اختر ملفك المحلي لحفظ العقار" title="حفظ العقار"><Heart /></Button>;
    const label = mutation.isPending ? "جارٍ تحديث المحفوظات" : existing ? "إلغاء حفظ العقار" : "حفظ العقار";
    return <div className="flex gap-2">
      {saved.isError ? <Button variant="outline" size="icon" className="size-10 rounded-full bg-card/95 focus-visible:ring-ring" aria-label="إعادة تحميل المحفوظات" title="تعذّر تحميل المحفوظات — أعد المحاولة" disabled={saved.isFetching} onClick={() => void saved.refetch()}><RefreshCw /></Button> : <Button variant="outline" size="icon" className="size-10 rounded-full bg-card/95 focus-visible:ring-ring" aria-label={label} title={label} aria-pressed={!!existing} disabled={!valid || saved.isPending || mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending ? <LoaderCircle className="motion-safe:animate-spin" /> : <Heart className={existing ? "fill-current" : undefined} />}</Button>}
      {existing?.id ? <Button nativeButton={false} render={<Link href={`/compare?first=${existing.id}`} />} variant="outline" size="icon" className="size-10 rounded-full bg-card/95 focus-visible:ring-ring" aria-label="قارن مع عقار محفوظ" title="قارن"><Columns3 /></Button> : null}
      {mutation.isSuccess ? <span role="status" className="sr-only">تم تحديث المحفوظات لدى الخادم.</span> : null}
    </div>;
  }
  if (!userId) return <Button nativeButton={false} render={<Link href="/login" />} variant={compact ? "ghost" : "outline"} size={compact ? "sm" : "default"}><Heart data-icon="inline-start" />{compact ? "حفظ العقار" : "اختر ملفك المحلي للحفظ"}</Button>;
  return <div className="flex w-full flex-col gap-3">
    <div className="flex flex-wrap gap-2"><Button size={compact ? "sm" : "default"} variant={existing ? "secondary" : compact ? "ghost" : "outline"} aria-pressed={!!existing} disabled={!valid || saved.isPending || saved.isError || mutation.isPending} onClick={() => mutation.mutate()}><Heart data-icon="inline-start" className={existing ? "fill-current" : undefined} />{mutation.isPending ? "جارٍ الحفظ…" : existing ? compact ? "إلغاء الحفظ" : "إزالة من المحفوظات" : "حفظ العقار"}</Button>{existing?.id ? <Button size={compact ? "sm" : "default"} nativeButton={false} render={<Link href={`/compare?first=${existing.id}`} />} variant={compact ? "ghost" : "outline"}>{compact ? "قارن" : "قارن مع عقار محفوظ"}</Button> : null}</div>
    {saved.isError ? <ErrorState error={saved.error} retry={() => void saved.refetch()} /> : null}
    {mutation.isError ? <ErrorState error={mutation.error} /> : null}
    {mutation.isSuccess ? <p role="status" className="text-xs text-primary">تم تحديث المحفوظات لدى الخادم.</p> : null}
  </div>;
}
export function PropertyCard({ property }: { property: Property; appearance?: "default" | "image" }) {
  const locale = useLocale(); const ar = locale === "ar";
  const valid = !!property.externalId && !["null", "undefined"].includes(property.externalId);
  const href = valid ? propertyHref(property) : undefined;
  const listing = propertyCardData(property, ar ? "عقار بدون عنوان" : "Untitled property");
  return <PropertyCardView listing={listing} href={href} onNavigate={href ? () => rememberPropertyOrigin(href) : undefined}
    overlayActions={<PropertyActions property={property} overlay />}
    metadata={<details className="text-caption text-muted-foreground"><summary className="cursor-pointer rounded outline-offset-4 focus-visible:outline-2 focus-visible:outline-ring">{ar ? "معلومات الإعلان" : "Listing information"}</summary><p className="mt-1 wrap-break-word"><bdi>{property.sourceName || property.source}</bdi>{propertyTypeLabel(property.propertyType) ? ` · ${propertyTypeLabel(property.propertyType)}` : ""}</p></details>}
    footer={href ? <Button variant="outline" className="w-full justify-between" nativeButton={false} render={<Link href={href} onNavigate={() => rememberPropertyOrigin(href)} />}>{ar ? "عرض العقار" : "View property"}<ArrowUpLeft data-icon="inline-end" className="ltr:-scale-x-100" /></Button> : <p className="text-caption text-muted-foreground">{ar ? "معرّف الإعلان غير متاح" : "Listing reference unavailable"}</p>} />;
}
