"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import type { SavedProperty } from "@/lib/api/contracts";
import { discovery } from "@/lib/api/discovery";
import { apiLanguage } from "@/lib/api/config";
import { savedPropertiesApi } from "@/lib/api/saved-properties";
import { invalidateUserData } from "@/features/account/api/invalidation";
import { useIdentity } from "@/features/account/identity";
import { SavedPropertyCard } from "./saved-property-card";

// The saved DTO usually embeds its live listing. This detail fallback handles
// older or partial responses and caps concurrent requests at two.
let activeDetails = 0;
const waitingDetails: (() => void)[] = [];
async function loadDetail<T>(signal: AbortSignal, load: () => Promise<T>): Promise<T> {
  if (activeDetails >= 2)
    await new Promise<void>((resolve) => waitingDetails.push(resolve));
  else activeDetails++;
  try {
    signal.throwIfAborted();
    return await load();
  } finally {
    const next = waitingDetails.shift();
    if (next) next();
    else activeDetails--;
  }
}

export function SavedPropertyGrid({
  properties,
  selectedIds,
  onToggleSelected,
  onRemoved,
}: {
  properties: SavedProperty[];
  selectedIds: number[];
  onToggleSelected: (id: number) => void;
  onRemoved: (id: number) => void;
}) {
  const locale = useLocale();
  const language = apiLanguage(locale);
  const { userId } = useIdentity();
  const cache = useQueryClient();
  const container = useRef<HTMLDivElement>(null);
  const [approaching, setApproaching] = useState<Set<string>>(() => new Set());
  const references = JSON.stringify(
    properties.map((property) => [property.source, property.externalPropertyId]),
  );
  useEffect(() => {
    const cards = container.current?.querySelectorAll<HTMLElement>("[data-listing-key]");
    if (!cards) return;
    const reveal = (keys: string[]) =>
      setApproaching((previous) => new Set([...previous, ...keys]));
    if (!("IntersectionObserver" in window)) {
      const frame = requestAnimationFrame(() =>
        reveal(Array.from(cards, (card) => card.dataset.listingKey!)),
      );
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (!visible.length) return;
        reveal(visible.map((entry) => (entry.target as HTMLElement).dataset.listingKey!));
        visible.forEach((entry) => observer.unobserve(entry.target));
      },
      { rootMargin: "200px" },
    );
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [references]);
  const details = useQueries({
    queries: properties.map((property) => ({
      queryKey: ["property", property.source, property.externalPropertyId, language],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        loadDetail(signal, () =>
          discovery.detail(
            property.source,
            property.externalPropertyId,
            signal,
            language,
          ),
        ),
      enabled:
        !property.property &&
        property.available !== false &&
        approaching.has(JSON.stringify([property.source, property.externalPropertyId])) &&
        !!property.source &&
        !!property.externalPropertyId &&
        !["null", "undefined"].includes(property.externalPropertyId),
      staleTime: 10 * 60 * 1000,
      retry: false,
    })),
  });
  return (
    <div
      ref={container}
      className="@container/saved-grid min-w-0"
    >
      <div className="grid auto-rows-fr gap-4 @min-[44rem]/saved-grid:grid-cols-2">
        {properties.map((property, index) => {
          const query = details[index];
          const valid =
            !!property.source &&
            !!property.externalPropertyId &&
            !["null", "undefined"].includes(property.externalPropertyId);
          const listing = property.property ?? query.data;
          const selected = property.id != null && selectedIds.includes(property.id);
          const sameSelectionExists = selectedIds.some((id) =>
            properties.some(
              (candidate) =>
                candidate.id === id &&
                candidate.source.toUpperCase() === property.source.toUpperCase() &&
                candidate.externalPropertyId === property.externalPropertyId,
            ),
          );
          return (
            <div
              key={property.id ?? `${property.source}:${property.externalPropertyId}`}
              data-listing-key={JSON.stringify([
                property.source,
                property.externalPropertyId,
              ])}
              className="min-w-0"
            >
              <SavedPropertyCard
                property={property}
                listing={listing}
                loading={
                  query.isPending &&
                  valid &&
                  !property.property &&
                  property.available !== false
                }
                detailsFailed={query.isError || property.available === false || !valid}
                refreshing={query.isFetching || !valid || property.available === false}
                onRetry={() => {
                  if (valid && property.available !== false) void query.refetch();
                }}
                selected={selected}
                selectionDisabled={
                  property.id == null ||
                  property.available === false ||
                  (!selected && selectedIds.length >= 2) ||
                  (!selected && sameSelectionExists)
                }
                onToggleSelected={() => {
                  if (property.id != null) onToggleSelected(property.id);
                }}
                onRemove={async () => {
                  await savedPropertiesApi.remove(property.id!);
                  await invalidateUserData(cache, userId);
                  if (property.id != null) onRemoved(property.id);
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
