"use client";

import Image from "next/image";
import { useState } from "react";
import { Bath, BedDouble, Heart, House, MapPin, Ruler, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArchitecturalArt } from "./architectural-art";
import { regions } from "./regions";
import { useMadarCopy } from "./use-madar-copy";
import type { PreviewProperty } from "./preview-data";
import { cn } from "@/lib/utils";

export function PropertyCard({ property, saved, compared, onSave, onCompare, onDetails }: { property: PreviewProperty; saved: boolean; compared: boolean; onSave: () => void; onCompare: () => void; onDetails: () => void }) {
  const { text, locale } = useMadarCopy();
  const [failedImage, setFailedImage] = useState(false);
  const region = regions.find((item) => item.id === property.regionId);
  const format = (value: number) => new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA").format(value);
  const title = property.title?.trim() || text("عنوان غير متاح", "Title unavailable");
  return <Card className="min-w-0 border border-border pt-0 transition-[transform,box-shadow] duration-200 hover:shadow-stone motion-safe:hover:-translate-y-1">
    <div className="relative h-52 overflow-hidden">
      {property.image && !failedImage ? <Image src={property.image} alt={title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" unoptimized onError={() => setFailedImage(true)} className="object-cover" /> : region ? <><ArchitecturalArt className="absolute inset-0" /><div className={cn("absolute inset-0 opacity-25 mix-blend-color", region.tone)} /></> : <div className="flex h-full items-center justify-center gap-2 bg-secondary text-muted-foreground"><House className="size-7" /><span className="text-xs">{text("الصورة غير متاحة", "Image unavailable")}</span></div>}
      <div className="absolute start-3 top-3"><Badge variant="secondary" className="max-w-full whitespace-normal text-start leading-4">{text("نموذج تصميم • ليس إعلانًا فعليًا", "Design preview • not a live listing")}</Badge></div>
      <Button size="icon-lg" variant="outline" className="absolute end-3 top-11 rounded-full" onClick={onSave} aria-pressed={saved} aria-label={text(saved ? "إزالة من محفوظات المعاينة" : "حفظ في المعاينة", saved ? "Remove from preview favorites" : "Save in preview")}><Heart className={cn(saved && "fill-current")} /></Button>
      {region ? <p className="absolute bottom-4 start-4 text-sm font-bold text-[var(--illustration-paper)]">{text(region.labelAr, region.labelEn)} · {text("رسم توضيحي", "Illustration")}</p> : null}
    </div>
    <CardHeader><CardTitle><h3 className="min-h-14 break-words leading-7 [overflow-wrap:anywhere]"><bdi>{title}</bdi></h3></CardTitle><CardDescription><span className="flex items-center gap-1.5"><MapPin className="size-3.5 shrink-0" /><bdi>{[property.city, property.neighborhood].filter(Boolean).join(" · ") || text("الموقع غير متاح", "Location unavailable")}</bdi></span></CardDescription></CardHeader>
    <CardContent>
      <p className="text-xl font-black text-primary"><bdi>{property.price != null ? `${format(property.price)} ${text("ر.س", "SAR")}` : text("السعر غير متاح", "Price unavailable")}</bdi>{property.price != null ? <span className="ms-1 text-xs font-normal text-muted-foreground">{property.purpose === "rent" ? text("/ سنويًا", "/ year") : text("سعر البيع", "sale price")}</span> : null}</p>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t pt-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><BedDouble className="size-3.5" />{property.bedrooms == null ? text("الغرف غير محددة", "Beds unspecified") : `${format(property.bedrooms)} ${text("غرف", "beds")}`}</span>
        <span className="inline-flex items-center gap-1"><Bath className="size-3.5" />{property.bathrooms == null ? text("الحمامات غير محددة", "Baths unspecified") : `${format(property.bathrooms)} ${text("حمامات", "baths")}`}</span>
        <span className="inline-flex items-center gap-1"><Ruler className="size-3.5" /><bdi>{property.areaSqm == null ? text("المساحة غير محددة", "Area unspecified") : `${format(property.areaSqm)} ${text("م²", "m²")}`}</bdi></span>
      </div>
    </CardContent>
    <CardFooter className="mt-auto flex-wrap gap-2"><Button className="h-11 flex-1" onClick={onDetails}>{text("عرض التفاصيل", "View details")}</Button><Button variant="outline" className="h-11 flex-1" onClick={onCompare} aria-pressed={compared}><Scale data-icon="inline-start" />{compared ? text("بالمقارنة", "Selected") : text("قارن", "Compare")}</Button></CardFooter>
  </Card>;
}

export function PropertyCardSkeleton() {
  return <Card aria-busy="true"><Skeleton className="h-52 w-full" /><CardHeader><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2" /></CardHeader><CardContent><Skeleton className="h-8 w-2/3" /></CardContent><CardFooter><Skeleton className="h-11 w-full" /></CardFooter></Card>;
}

export function PropertyGrid({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}
