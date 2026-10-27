"use client";
import { getProductCopy } from "@/messages/product-copy";
import { QueryFeedback } from "@/components/shared/query-feedback";
import { SummarySkeleton } from "@/components/shared/page-skeleton";
import { PropertyGridSkeleton } from "@/features/properties/skeletons";
import { useLocale } from "next-intl";
import { apiLanguage } from "@/lib/api/config";
import { SmartRecommendationsPanel } from "./smart-recommendations";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { discovery } from "@/lib/api/discovery";
import { useHousing } from "@/features/account/api/query-hooks";
import { useIdentity } from "@/features/account/identity";
import { ErrorState } from "@/components/shared/error-state";
import { Panel } from "@/components/shared/panel";
import { PropertyCard } from "@/features/properties/property-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function RecommendationsPanel() {
  const locale = useLocale();
  const text = getProductCopy(locale);
  const language = apiLanguage(locale);
  const { userId } = useIdentity();
  const preferences = useHousing(userId);
  const [kind, setKind] = useState<
    "by-preference-in-my-district" | "within-budget" | "under-budget" | null
  >(null);
  const [margin, setMargin] = useState("1");
  const [submittedMargin, setSubmittedMargin] = useState(0);
  const [summary, setSummary] = useState(false);
  const [stats, setStats] = useState(false);
  const query = useQuery({
    queryKey: [
      "recommendations",
      userId,
      kind,
      submittedMargin,
      preferences.data,
      language,
    ],
    queryFn: ({ signal }) =>
      kind === "under-budget"
        ? discovery.underBudget(submittedMargin, signal, language)
        : discovery.personalized(
            kind === "by-preference-in-my-district" && !preferences.data?.district?.trim()
              ? "within-budget"
              : kind!,
            signal,
            language,
          ),
    enabled: !!kind && !!preferences.data,
    retry: false,
  });
  const match = useQuery({
    queryKey: ["match-summary", userId, preferences.data],
    queryFn: ({ signal }) => discovery.match(signal),
    enabled: summary && !!preferences.data,
    retry: false,
  });
  const market = useQuery({
    queryKey: ["market-stats", preferences.data],
    queryFn: ({ signal }) =>
      discovery.stats(
        preferences.data!.city,
        preferences.data!.listingType,
        preferences.data!.propertyType,
        signal,
      ),
    enabled: stats && !!preferences.data,
    retry: false,
  });
  return (
    <section className="flex flex-col gap-6">
      <SmartRecommendationsPanel />
      <details className="rounded-xl border border-border/60 p-4">
        <summary className="cursor-pointer rounded-md text-sm font-medium">
          {locale === "ar"
            ? "فلاتر الميزانية وإحصاءات السوق"
            : "Budget filters and market statistics"}
        </summary>
        <div className="mt-4 [&_[data-slot=card]]:border-0 [&_[data-slot=card]]:shadow-none">
          <Panel
            title={text.recommendations}
            description={text.recommendationsHint}
          >
            <div className="flex flex-col gap-5">
              <QueryFeedback query={preferences} />
              {preferences.isPending ? (
                <SummarySkeleton />
              ) : preferences.isError && !preferences.data ? (
                <ErrorState
                  error={preferences.error}
                  retry={() => void preferences.refetch()}
                />
              ) : !preferences.data ? (
                <p>{text.setupPreferences}</p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() =>
                        setKind(
                          preferences.data?.district?.trim()
                            ? "by-preference-in-my-district"
                            : "within-budget",
                        )
                      }
                    >
                      {preferences.data?.district?.trim()
                        ? text.districtPreference
                        : text.cityPreference}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setKind("within-budget")}
                    >
                      {text.withinBudget}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSummary(true)}
                    >
                      {text.matchSummary}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setStats(true)}
                    >
                      {text.marketStats}
                    </Button>
                  </div>
                  <label className="flex w-full max-w-xs flex-col gap-2 text-sm">
                    {text.margin}
                    <Input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      max="2147483647"
                      value={margin}
                      onChange={(e) => setMargin(e.target.value)}
                    />
                  </label>
                  <Button
                    className="self-start"
                    variant="outline"
                    disabled={
                      !Number.isInteger(Number(margin)) ||
                      Number(margin) <= 0 ||
                      Number(margin) > 2147483647 ||
                      Number(margin) >= Math.trunc(preferences.data?.maxBudget || 0)
                    }
                    onClick={() => {
                      setSubmittedMargin(Number(margin));
                      setKind("under-budget");
                    }}
                  >
                    {text.showMargin}
                  </Button>
                </>
              )}
              {kind && preferences.data ? <QueryFeedback query={query} /> : null}
              {kind && preferences.data ? (
                query.isPending ? (
                  <PropertyGridSkeleton
                    count={2}
                    className="lg:grid-cols-2"
                  />
                ) : query.isError && !query.data?.length ? (
                  <ErrorState
                    error={query.error}
                    retry={() => void query.refetch()}
                  />
                ) : query.data?.length ? (
                  <div className="grid gap-5 md:grid-cols-2">
                    {query.data.map((p, i) => (
                      <PropertyCard
                        key={`${p.source}:${p.externalId || i}`}
                        property={p}
                      />
                    ))}
                  </div>
                ) : (
                  <p>{text.noResults}</p>
                )
              ) : null}
              {summary && preferences.data ? <QueryFeedback query={match} /> : null}
              {summary && preferences.data ? (
                match.isPending ? (
                  <SummarySkeleton />
                ) : match.isError && !match.data ? (
                  <ErrorState
                    error={match.error}
                    retry={() => void match.refetch()}
                  />
                ) : match.data ? (
                  <dl className="grid grid-cols-2 gap-4 rounded-xl bg-secondary/40 p-4 xl:grid-cols-4">
                    {[
                      [text.budget, match.data.budget],
                      [text.listings, match.data.totalListings],
                      [text.inDistrict, match.data.inMyDistrict],
                      [text.lowestPrice, match.data.cheapestPrice],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-xs text-muted-foreground">{label}</dt>
                        <dd className="mt-1 text-sm font-semibold tabular-nums">
                          {typeof value === "number"
                            ? new Intl.NumberFormat(locale).format(value)
                            : text.unavailable}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : null
              ) : null}
              {stats && preferences.data ? <QueryFeedback query={market} /> : null}
              {stats && preferences.data ? (
                market.isPending ? (
                  <SummarySkeleton />
                ) : market.isError && !market.data ? (
                  <ErrorState
                    error={market.error}
                    retry={() => void market.refetch()}
                  />
                ) : market.data ? (
                  <section className="rounded-xl bg-secondary/40 p-4">
                    <h3 className="mb-3 text-sm font-semibold">{text.marketStats}</h3>
                    <dl className="grid gap-4 sm:grid-cols-3">
                      {[
                        [text.listings, market.data.totalListings],
                        [text.lowestPrice, market.data.minPrice],
                        [text.highestPrice, market.data.maxPrice],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <dt className="text-xs text-muted-foreground">{label}</dt>
                          <dd className="mt-1 font-semibold tabular-nums">
                            {typeof value === "number"
                              ? new Intl.NumberFormat(locale).format(value)
                              : text.unavailable}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {text.annualRent}
                    </p>
                  </section>
                ) : null
              ) : null}
            </div>
          </Panel>
        </div>
      </details>
    </section>
  );
}
