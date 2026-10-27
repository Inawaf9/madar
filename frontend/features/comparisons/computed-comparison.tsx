"use client";
import { getProductCopy } from "@/messages/product-copy";
import { useState } from "react";
import { useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { useHousing, useSaved } from "@/features/account/api/query-hooks";
import { insights } from "@/lib/api/insights";
import { apiLanguage } from "@/lib/api/config";
import type { PropertyComparison } from "@/lib/api/contracts";
import type { ComputedComparison } from "@/lib/api/insight-contracts";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { FieldSet, FieldLegend, FieldLabel } from "@/components/ui/field";
import { MadarLoader } from "@/components/branding/madar-loader";
import { ComparisonTableSkeleton } from "@/features/comparisons/skeletons";
import { QueryFeedback } from "@/components/shared/query-feedback";
import { useIdentity } from "@/features/account/identity";
import { ErrorState } from "@/components/shared/error-state";
import { Panel } from "@/components/shared/panel";
import { ScoreFacts, SafeMarkdown } from "@/features/insights/analysis-ui";
import { propertyHref } from "@/features/properties/format";
import { PropertyFacts } from "@/features/properties/property-facts";
import { safeUrl } from "@/lib/safe-url";

function ComparisonResults({ data }: { data: ComputedComparison }) {
  const locale = useLocale();
  const text = getProductCopy(locale);
  const maxScore = Math.max(
    ...data.properties.map((item) =>
      Number.isFinite(item.matchScore) ? item.matchScore : -Infinity,
    ),
  );
  const leaders = data.properties.filter((item) => item.matchScore === maxScore);
  const analysis = data.aiAnalysis;
  const identified =
    analysis?.recommendedSavedPropertyId != null
      ? leaders.find(
          (item) => item.savedPropertyId === analysis.recommendedSavedPropertyId,
        )
      : analysis?.recommendedExternalPropertyId
        ? leaders.find(
            (item) => item.externalPropertyId === analysis.recommendedExternalPropertyId,
          )
        : undefined;
  const winner = identified ?? (leaders.length === 1 ? leaders[0] : null);
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {data.properties.map((item) => (
          <article
            key={item.savedPropertyId ?? `${item.source}:${item.externalPropertyId}`}
            className="flex min-w-0 flex-col gap-3 rounded-xl bg-secondary/30 p-4"
          >
            <h3
              dir="auto"
              className="break-words text-start font-semibold"
            >
              {item.title || text.untitled}
            </h3>
            <p className="text-xs text-muted-foreground">
              {item.neighborhood || text.noDistrict}
            </p>
            <p className="text-sm font-medium">
              {item.price == null
                ? text.unavailable
                : `${new Intl.NumberFormat(locale).format(item.price)} ${locale === "ar" ? "ر.س" : "SAR"}`}
            </p>
            <PropertyFacts
              property={{
                bedrooms: item.bedrooms,
                bathrooms: null,
                areaSqm: item.areaSqm,
              }}
              locale={locale}
            />
            <ScoreFacts
              match={item.matchScore}
              housing={item.housingScore}
              commute={item.commuteScore}
              services={item.servicesScore}
            />
            <Link
              href={propertyHref({
                source: item.source,
                externalId: item.externalPropertyId,
              })}
              className="text-sm text-primary underline"
            >
              {text.propertyDetails}
            </Link>
            {safeUrl(item.listingUrl) ? (
              <a
                href={safeUrl(item.listingUrl)!}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary underline"
              >
                {locale === "ar" ? "الإعلان الأصلي" : "Original listing"}
              </a>
            ) : null}
          </article>
        ))}
      </div>
      {analysis ? (
        <div className="flex flex-col gap-3 border-t border-border/60 pt-5">
          <h3 className="font-semibold">
            {text.recommended}:{" "}
            {winner?.title || (winner ? winner.externalPropertyId : text.unavailable)}
          </h3>
          {leaders.length > 1 && !winner ? (
            <p className="text-sm text-muted-foreground">
              {locale === "ar"
                ? "الخيارات الأعلى متعادلة في درجة المطابقة."
                : "The leading properties have equal match scores."}
            </p>
          ) : null}
          <SafeMarkdown text={analysis.reason} />
          {analysis.alternativeReason || analysis.tradeOff ? (
            <details>
              <summary className="cursor-pointer py-2 text-sm text-primary">
                {locale === "ar"
                  ? "البدائل وما ينبغي مراعاته"
                  : "Alternatives and trade-offs"}
              </summary>
              <SafeMarkdown text={analysis.alternativeReason} />
              <SafeMarkdown text={analysis.tradeOff} />
            </details>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{text.noExplanation}</p>
      )}
    </>
  );
}

export function ComputedComparisonPanel({ pair }: { pair?: PropertyComparison }) {
  const { userId } = useIdentity();
  const locale = useLocale();
  const text = getProductCopy(locale);
  const saved = useSaved(userId);
  const housing = useHousing(userId);
  const [selected, setSelected] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState<number[] | "pair" | null>(null);
  const query = useQuery({
    queryKey: ["computed-comparison", userId, apiLanguage(locale), pair, submitted],
    queryFn: ({ signal }) => {
      if (submitted === "pair" && pair)
        return insights.compareTwo(
          pair.firstPropertySource,
          pair.firstPropertyId,
          pair.secondPropertySource,
          pair.secondPropertyId,
          apiLanguage(locale),
          signal,
        );
      if (Array.isArray(submitted) && submitted.length === 2) {
        const first = saved.data?.find((item) => item.id === submitted[0]);
        const second = saved.data?.find((item) => item.id === submitted[1]);
        if (first && second)
          return insights.compareTwo(
            first.source,
            first.externalPropertyId,
            second.source,
            second.externalPropertyId,
            apiLanguage(locale),
            signal,
          );
      }
      return insights.compareMultiple(submitted as number[], apiLanguage(locale), signal);
    },
    enabled:
      submitted !== null && !!housing.data && (submitted === "pair" || !!saved.data),
    retry: false,
  });
  const selectionValid = pair
    ? pair.firstPropertyId !== pair.secondPropertyId ||
      pair.firstPropertySource.toUpperCase() !== pair.secondPropertySource.toUpperCase()
    : selected.length >= 2 &&
      selected.length <= 4 &&
      selected.every((id) => saved.data?.some((p) => p.id === id));
  return (
    <Panel
      title={text.comparison}
      description={text.comparisonHint}
    >
      <div className="flex flex-col gap-4">
        <QueryFeedback query={housing} />
        {housing.isPending ? (
          <ComparisonTableSkeleton />
        ) : housing.isError && !housing.data ? (
          <ErrorState
            error={housing.error}
            retry={() => void housing.refetch()}
          />
        ) : !housing.isPending && !housing.data ? (
          <Link
            href="/profile"
            className="text-sm text-primary underline"
          >
            {text.setupPreferences}
          </Link>
        ) : null}
        {!pair ? (
          <>
            <QueryFeedback query={saved} />
            {saved.isPending ? (
              <ComparisonTableSkeleton />
            ) : saved.isError && !saved.data ? (
              <ErrorState
                error={saved.error}
                retry={() => void saved.refetch()}
              />
            ) : (
              <FieldSet disabled={query.isFetching}>
                <FieldLegend variant="label">{text.chooseProperties}</FieldLegend>
                <div className="grid gap-2 md:grid-cols-2">
                  {saved.data
                    ?.filter((p) => p.id != null)
                    .map((p) => (
                      <FieldLabel
                        key={p.id}
                        className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border/70 p-3 has-checked:border-primary/50 has-checked:bg-primary/8 has-disabled:cursor-not-allowed has-disabled:opacity-60"
                      >
                        <input
                          type="checkbox"
                          className="size-4 shrink-0 accent-primary"
                          checked={selected.includes(p.id!)}
                          disabled={selected.length >= 4 && !selected.includes(p.id!)}
                          onChange={(event) =>
                            setSelected((old) =>
                              event.target.checked
                                ? [...old, p.id!]
                                : old.filter((id) => id !== p.id),
                            )
                          }
                        />
                        <span
                          dir="auto"
                          className="min-w-0 break-words"
                        >
                          {p.titleSnapshot || p.externalPropertyId}
                        </span>
                      </FieldLabel>
                    ))}
                </div>
              </FieldSet>
            )}
          </>
        ) : null}
        <Button
          className="self-start"
          disabled={!selectionValid || !housing.data || query.isFetching}
          onClick={() => {
            const next = pair ? "pair" : [...selected];
            if (JSON.stringify(next) === JSON.stringify(submitted)) void query.refetch();
            else setSubmitted(next);
          }}
        >
          {query.isFetching ? text.calculating : text.calculateComparison}
        </Button>
        <p className="text-xs leading-5 text-muted-foreground">
          {text.comparisonCreditNotice}
        </p>
        {submitted ? (
          <>
            <QueryFeedback query={query} />
            {query.isPending ? (
              <>
                <MadarLoader
                  decorative
                  size="md"
                  className="self-center"
                />
                <ComparisonTableSkeleton />
              </>
            ) : query.isError && !query.data ? (
              <ErrorState
                error={query.error}
                retry={() => void query.refetch()}
                retryDisabled={query.isFetching}
              />
            ) : query.data ? (
              <ComparisonResults data={query.data} />
            ) : null}
          </>
        ) : null}
      </div>
    </Panel>
  );
}
