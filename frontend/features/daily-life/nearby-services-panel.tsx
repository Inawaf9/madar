"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  Coffee,
  Cross,
  GraduationCap,
  ShoppingCart,
  Trees,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import type { MapPoi, PoiCategory } from "@/lib/maps/poi";
import { categoryLabel } from "@/lib/maps/place-presentation";
import { haversineDistanceMeters } from "@/lib/maps/nearby-distance";

const categories: { key: PoiCategory; icon: LucideIcon }[] = [
  { key: "supermarket", icon: ShoppingCart },
  { key: "pharmacy", icon: Cross },
  { key: "hospital", icon: Cross },
  { key: "park", icon: Trees },
  { key: "cafe", icon: Coffee },
  { key: "school", icon: GraduationCap },
];

export function NearbyServicesPanel({
  category,
  onCategoryChange,
  places,
  home,
  loading,
  error,
  retry,
  selectedId,
  onSelect,
}: {
  category: PoiCategory | null;
  onCategoryChange: (category: PoiCategory) => void;
  places: MapPoi[];
  home: { latitude: number; longitude: number } | null;
  loading: boolean;
  error?: unknown;
  retry: () => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const t = useTranslations("Workspace");
  const locale = useLocale();
  return (
    <section className="rounded-3xl border border-border/70 bg-card p-4 shadow-panel sm:p-5">
      <div>
        <h2 className="text-lg font-semibold">{t("nearbyServicesTitle")}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {t("nearbyServicesHint")}
        </p>
      </div>
      <div
        className="mt-4 flex flex-wrap gap-2"
        role="group"
        aria-label={t("nearbyCategories")}
      >
        {categories.map(({ key, icon: Icon }) => (
          <Button
            key={key}
            type="button"
            variant={category === key ? "secondary" : "outline"}
            size="sm"
            aria-pressed={category === key}
            disabled={!home}
            onClick={() => onCategoryChange(key)}
            className="min-h-10 rounded-xl"
          >
            <Icon data-icon="inline-start" />
            {categoryLabel(key, locale)}
          </Button>
        ))}
      </div>
      <div
        className="mt-4"
        aria-live="polite"
      >
        {!home ? (
          <p className="text-sm text-muted-foreground">{t("nearbyRequiresHome")}</p>
        ) : !category ? (
          <p className="text-sm text-muted-foreground">{t("chooseNearbyCategory")}</p>
        ) : loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <Skeleton
                key={index}
                className="h-20 rounded-xl"
              />
            ))}
          </div>
        ) : error ? (
          <ErrorState
            error={error}
            retry={retry}
          />
        ) : places.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noNearbyServices")}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {places.map((place) => {
              const id = `service:${place.id}`;
              const meters = haversineDistanceMeters(
                home.latitude,
                home.longitude,
                place.latitude,
                place.longitude,
              );
              return (
                <li key={place.id}>
                  <button
                    type="button"
                    aria-pressed={selectedId === id}
                    onClick={() => onSelect(id)}
                    className="flex min-h-24 w-full flex-col gap-1 rounded-xl border border-border/70 bg-background/60 p-3 text-start transition-colors hover:border-primary/40 aria-pressed:border-primary aria-pressed:bg-primary/5 motion-reduce:transition-none"
                  >
                    <span
                      className="font-medium"
                      dir="auto"
                    >
                      {place.name || categoryLabel(place.category, locale)}
                    </span>
                    {place.address ? (
                      <span
                        className="line-clamp-1 text-xs text-muted-foreground"
                        dir="auto"
                      >
                        {place.address}
                      </span>
                    ) : null}
                    {meters != null ? (
                      <span className="text-xs text-muted-foreground">
                        {t("straightLineMeters", {
                          count: new Intl.NumberFormat(locale, {
                            maximumFractionDigits: 0,
                          }).format(meters),
                        })}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
