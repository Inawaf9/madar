"use client";

import type { ReactNode } from "react";
import { useId } from "react";
import { useLocale } from "next-intl";
import { MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertyFacts } from "@/features/properties/property-facts";
import type { PropertyCardData } from "@/lib/property-card";
import { cn } from "@/lib/utils";
import { PropertyMedia } from "./property-media";

export function PropertyPrice({
  price,
  pricePeriod,
  compact = false,
}: Pick<PropertyCardData, "price" | "pricePeriod"> & { compact?: boolean }) {
  const locale = useLocale();
  const ar = locale === "ar";
  if (price == null || !Number.isFinite(price))
    return (
      <p className="text-sm text-muted-foreground">
        {ar ? "السعر غير متاح" : "Price unavailable"}
      </p>
    );
  const period =
    pricePeriod === "yearly"
      ? ar
        ? "/ سنويًا"
        : "/ year"
      : pricePeriod === "total"
        ? ar
          ? "إجمالي"
          : "total"
        : ar
          ? "الفترة غير محددة"
          : "Period unspecified";
  return (
    <p
      className={cn(
        "min-w-0 font-bold text-primary tabular-nums wrap-break-word",
        compact ? "text-title" : "text-price",
      )}
    >
      <bdi>
        {new Intl.NumberFormat(locale).format(price)}{" "}
        <span className="text-sm font-medium">{ar ? "ر.س" : "SAR"}</span>
      </bdi>
      <span className="ms-1.5 inline-block text-caption font-normal text-muted-foreground">
        {period}
      </span>
    </p>
  );
}

export function PropertyCardView({
  listing,
  variant = "standard",
  href,
  onNavigate,
  overlayActions,
  overlayStartActions,
  footer,
  status,
  metadata,
  badge,
  loading = false,
  imageFallback,
  className,
}: {
  listing: PropertyCardData;
  variant?: "standard" | "compact";
  href?: string;
  onNavigate?: () => void;
  overlayActions?: ReactNode;
  overlayStartActions?: ReactNode;
  footer?: ReactNode;
  status?: ReactNode;
  metadata?: ReactNode;
  badge?: ReactNode;
  loading?: boolean;
  imageFallback?: ReactNode;
  className?: string;
}) {
  const id = useId();
  const ar = useLocale() === "ar";
  const compact = variant === "compact";
  const type =
    listing.listingType === "rent"
      ? ar
        ? "للإيجار"
        : "For rent"
      : listing.listingType === "sale"
        ? ar
          ? "للبيع"
          : "For sale"
        : null;
  return (
    <Card
      aria-labelledby={id}
      size={compact ? "sm" : "default"}
      className={cn(
        "group/property h-full min-w-0 gap-0 py-0 transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-panel motion-reduce:transition-none",
        compact && "[--card-spacing:0.75rem]",
        className,
      )}
    >
      <div className="relative isolate">
        <PropertyMedia
          src={listing.image}
          title={listing.title}
          loading={loading}
          fallback={imageFallback}
          sizes={compact ? "230px" : undefined}
        />
        {badge || type ? (
          <div className="pointer-events-none absolute start-3 top-3 max-w-[calc(100%-5rem)]">
            {badge || <Badge variant="secondary">{type}</Badge>}
          </div>
        ) : null}
        {overlayActions ? (
          <div className="absolute end-2 top-2">{overlayActions}</div>
        ) : null}
        {overlayStartActions ? (
          <div className="absolute bottom-2 start-2">{overlayStartActions}</div>
        ) : null}
      </div>
      <CardHeader className={cn("gap-2 pt-4", compact && "gap-1.5 pt-3")}>
        {loading ? (
          <Skeleton className="h-7 w-2/3" />
        ) : (
          <PropertyPrice
            price={listing.price}
            pricePeriod={listing.pricePeriod}
            compact={compact}
          />
        )}
        <CardTitle>
          <h3
            id={id}
            className={cn(
              "line-clamp-2 min-w-0 font-medium wrap-break-word",
              compact ? "text-sm" : "min-h-12 text-title",
            )}
          >
            {href ? (
              <Link
                href={href}
                onNavigate={onNavigate}
                className="rounded outline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
              >
                <bdi>{listing.title}</bdi>
              </Link>
            ) : (
              <bdi>{listing.title}</bdi>
            )}
          </h3>
        </CardTitle>
        <CardDescription className="flex min-w-0 items-start gap-1.5 text-caption">
          <MapPin
            aria-hidden="true"
            className="mt-1 size-3.5 shrink-0"
          />
          <bdi className="line-clamp-2 wrap-break-word">
            {listing.location || (ar ? "الموقع غير متاح" : "Location unavailable")}
          </bdi>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 pt-3">
        {loading ? (
          <Skeleton className="h-5 w-3/4" />
        ) : (
          <PropertyFacts
            property={listing}
            locale={ar ? "ar" : "en"}
            hideEmpty
          />
        )}
        {metadata}
        {status}
      </CardContent>
      {footer ? (
        <CardFooter
          className={cn("mt-auto flex-wrap gap-2 pt-4 pb-5", compact && "pt-2 pb-3")}
        >
          {footer}
        </CardFooter>
      ) : (
        <div className="pb-4" />
      )}
    </Card>
  );
}

export function PropertyCardPlaceholder({ compact = false }: { compact?: boolean }) {
  return (
    <Card
      size={compact ? "sm" : "default"}
      aria-hidden="true"
      className="min-w-0 gap-0 py-0"
    >
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <CardHeader className="gap-3 pt-4">
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>
      <CardContent className="pt-3">
        <Skeleton className="h-5 w-2/3" />
      </CardContent>
      <CardFooter className="pt-4 pb-5">
        <Skeleton className="h-11 w-full rounded-xl" />
      </CardFooter>
    </Card>
  );
}
