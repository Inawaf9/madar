"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUpRight, Columns3, Home, X } from "lucide-react";

import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertyMedia } from "@/features/properties/property-media";
import type { PropertyComparison, SavedProperty } from "@/lib/api/contracts";
import { Link } from "@/i18n/navigation";

function titleFor(property: SavedProperty, locale: string) {
  const listingTitle = property.property
    ? locale === "ar"
      ? property.property.titleAr || property.property.title
      : property.property.titleEn || property.property.title
    : null;
  return (
    listingTitle?.trim() ||
    (locale === "ar" ? property.titleSnapshotAr : property.titleSnapshotEn)?.trim() ||
    property.titleSnapshot?.trim() ||
    (locale === "ar" ? "عقار محفوظ" : "Saved property")
  );
}

function SelectionSlot({
  property,
  locale,
  onRemove,
}: {
  property?: SavedProperty;
  locale: string;
  onRemove: () => void;
}) {
  const t = useTranslations("Workspace");
  const listing = property?.property;
  const title = property ? titleFor(property, locale) : "";

  if (!property) {
    return (
      <div className="flex min-h-24 items-center gap-3 rounded-2xl border border-dashed border-border bg-background/60 p-3">
        <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
          <Home
            aria-hidden="true"
            className="size-6"
          />
        </span>
        <span className="text-sm text-muted-foreground">{t("comparisonChooseSlot")}</span>
      </div>
    );
  }

  const location = [
    locale === "ar"
      ? listing?.neighborhoodAr || listing?.neighborhood
      : listing?.neighborhoodNameEn || listing?.neighborhood,
    locale === "ar"
      ? listing?.cityNameAr || listing?.cityName || listing?.city
      : listing?.cityNameEn || listing?.cityName || listing?.city,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-primary/20 bg-background p-3">
      <div className="size-16 shrink-0 overflow-hidden rounded-xl">
        <PropertyMedia
          src={listing?.image ?? null}
          title={title}
          aspect="fill"
          sizes="64px"
          fallback={
            <div className="absolute inset-0">
              <Image
                src="/hero.png"
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
              <span className="absolute inset-x-0 bottom-0 bg-background/90 px-1 text-center text-[9px] leading-4 text-muted-foreground">
                {t("illustrativeImage")}
              </span>
            </div>
          }
        />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className="line-clamp-2 text-sm font-medium"
          dir="auto"
        >
          {title}
        </p>
        <p
          className="mt-1 truncate text-xs text-muted-foreground"
          dir="auto"
        >
          {location || t("locationUnavailable")}
        </p>
        <p className="mt-1 text-xs font-semibold text-primary">
          {listing?.price == null
            ? t("priceUnavailable")
            : `${new Intl.NumberFormat(locale).format(listing.price)} ${locale === "ar" ? "ر.س" : "SAR"}`}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 shrink-0 rounded-full"
        aria-label={t("removeFromComparison", { title })}
        onClick={onRemove}
      >
        <X
          aria-hidden="true"
          className="size-4"
        />
      </Button>
    </div>
  );
}

export function ComparisonPanel({
  properties,
  comparisons,
  selectedIds,
  loading,
  error,
  retry,
  onRemove,
}: {
  properties: SavedProperty[];
  comparisons: PropertyComparison[];
  selectedIds: number[];
  loading: boolean;
  error?: unknown;
  retry: () => void;
  onRemove: (id: number) => void;
}) {
  const locale = useLocale();
  const t = useTranslations("Workspace");
  const selected = selectedIds
    .map((id) => properties.find((property) => property.id === id))
    .filter((property): property is SavedProperty => !!property);
  const [first, second] = selected;
  const distinct =
    !!first?.id &&
    !!second?.id &&
    !(
      first.source.toUpperCase() === second.source.toUpperCase() &&
      first.externalPropertyId === second.externalPropertyId
    );
  const canStart =
    distinct &&
    !!first?.id &&
    !!second?.id &&
    first.available !== false &&
    second.available !== false;
  const existingPair = canStart
    ? (comparisons.find(
        (pair) =>
          pair.firstPropertySource.toUpperCase() === first.source.toUpperCase() &&
          pair.firstPropertyId === first.externalPropertyId &&
          pair.secondPropertySource.toUpperCase() === second.source.toUpperCase() &&
          pair.secondPropertyId === second.externalPropertyId,
      ) ??
      comparisons.find(
        (pair) =>
          pair.firstPropertySource.toUpperCase() === second.source.toUpperCase() &&
          pair.firstPropertyId === second.externalPropertyId &&
          pair.secondPropertySource.toUpperCase() === first.source.toUpperCase() &&
          pair.secondPropertyId === first.externalPropertyId,
      ))
    : undefined;
  const href =
    canStart && first?.id != null && second?.id != null
      ? existingPair?.id != null
        ? `/compare/${existingPair.id}`
        : `/compare?${new URLSearchParams({ first: String(first.id), second: String(second.id) })}`
      : undefined;

  return (
    <aside className="min-w-0">
      <div className="rounded-3xl border border-border/70 bg-card p-4 shadow-panel sm:p-5 lg:sticky lg:top-24">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
            <Columns3
              aria-hidden="true"
              className="size-5"
            />
          </span>
          <div>
            <h2 className="text-lg font-medium">{t("smartComparisonTitle")}</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {t("smartComparisonDescription")}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          {loading ? (
            <>
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
            </>
          ) : error ? (
            <ErrorState
              error={error}
              retry={retry}
            />
          ) : properties.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-background/60 p-4 text-sm text-muted-foreground">
              {t("comparisonNoSavedProperties")}
            </div>
          ) : (
            <>
              <SelectionSlot
                property={first}
                locale={locale}
                onRemove={() => first?.id != null && onRemove(first.id)}
              />
              <SelectionSlot
                property={second}
                locale={locale}
                onRemove={() => second?.id != null && onRemove(second.id)}
              />
            </>
          )}
        </div>

        {error || loading || properties.length === 0 ? null : href ? (
          <Button
            nativeButton={false}
            render={<Link href={href} />}
            className="mt-4 h-11 w-full rounded-xl"
          >
            {t("startComparison")}
            <ArrowUpRight
              data-icon="inline-end"
              className="rtl:-scale-x-100"
            />
          </Button>
        ) : (
          <Button
            disabled
            className="mt-4 h-11 w-full rounded-xl"
          >
            {t("startComparison")}
            <ArrowUpRight
              data-icon="inline-end"
              className="rtl:-scale-x-100"
            />
          </Button>
        )}

        {properties.length > 0 && !loading && !error ? (
          <div className="mt-5 rounded-2xl bg-secondary/50 p-4 text-xs leading-5 text-muted-foreground">
            {t("comparisonCreditNotice")}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
