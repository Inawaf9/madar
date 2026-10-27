"use client";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { placesApi } from "@/lib/api/places";
import { savedPropertiesApi } from "@/lib/api/saved-properties";
import type { SavedSummary, PlacesSummary } from "@/lib/api/contracts";
import { useIdentity } from "@/features/account/identity";
import { SummarySkeleton } from "@/components/shared/page-skeleton";
import { QueryFeedback } from "@/components/shared/query-feedback";
import { ErrorState } from "@/components/shared/error-state";
export function AccountGroupSummary({ kind }: { kind: "saved" | "places" }) {
  const locale = useLocale();
  const t = useTranslations("Workspace");
  const { userId } = useIdentity();
  const query = useQuery<SavedSummary | PlacesSummary>({
    queryKey: [kind === "saved" ? "saved-summary" : "places-summary", userId],
    queryFn: ({ signal }) =>
      kind === "saved" ? savedPropertiesApi.summary(signal) : placesApi.summary(signal),
    retry: false,
  });
  if (query.isPending) return <SummarySkeleton />;
  if (query.isError && !query.data)
    return (
      <ErrorState
        error={query.error}
        retry={() => void query.refetch()}
      />
    );
  const total =
    "totalSaved" in query.data ? query.data.totalSaved : query.data.totalPlaces;
  const groups =
    "countBySource" in query.data ? query.data.countBySource : query.data.countByType;
  return (
    <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl bg-secondary/40 px-4 py-3">
      <QueryFeedback query={query} />
      <p className="text-sm font-medium">
        {t(kind === "saved" ? "saved" : "locations")}{" "}
        <span className="ms-2 font-semibold tabular-nums">
          {new Intl.NumberFormat(locale).format(total)}
        </span>
      </p>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {Object.entries(groups).map(([label, count]) => (
          <li
            key={label}
            className="py-1"
          >
            <bdi>{label}</bdi>: {new Intl.NumberFormat(locale).format(count)}
          </li>
        ))}
      </ul>
    </div>
  );
}
