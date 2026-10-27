"use client";
import { getProductCopy } from "@/messages/product-copy";
import { useState } from "react";
import { useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { insights } from "@/lib/api/insights";
import { apiLanguage } from "@/lib/api/config";
import type { ApiLanguage } from "@/lib/api/config";
import { weightsSchema, type RecommendationWeights } from "@/lib/api/insight-contracts";
import { useHousing } from "@/features/account/api/query-hooks";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { PropertyGridSkeleton } from "@/features/properties/skeletons";
import { PropertyCardView } from "@/features/properties/property-card-view";
import { propertyCardData } from "@/lib/property-card";
import { Badge } from "@/components/ui/badge";
import { propertyHref } from "@/features/properties/format";
import { QueryFeedback } from "@/components/shared/query-feedback";
import { ErrorState } from "@/components/shared/error-state";
import { useIdentity } from "@/features/account/identity";
import {
  ScoreFacts,
  WeightsControl,
  SafeMarkdown,
} from "@/features/insights/analysis-ui";
import { PropertyActions } from "@/features/properties/property-card";
import { safeUrl } from "@/lib/safe-url";

export function SmartRecommendationsPanel({
  actionLabel,
}: { actionLabel?: string } = {}) {
  const { userId } = useIdentity();
  const locale = useLocale();
  const text = getProductCopy(locale);
  const preference = useHousing(userId);
  const [weights, setWeights] = useState<RecommendationWeights | null>(null);
  const [request, setRequest] = useState<{
    weights?: RecommendationWeights;
    nonce: string;
    language: ApiLanguage;
    userId: number;
  } | null>(null);
  const activeRequest = request?.userId === userId ? request : null;
  const query = useQuery({
    queryKey: ["smart", userId, activeRequest],
    queryFn: ({ signal }) =>
      insights.smart(activeRequest!.language, activeRequest!.weights, signal),
    enabled: !!activeRequest && !!preference.data,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-section font-medium">{text.smartTitle}</h2>
      <p className="text-xs leading-6 text-muted-foreground">{text.smartHint}</p>
      <Button
        className="self-start"
        disabled={
          !preference.data ||
          query.isFetching ||
          (!!weights && !weightsSchema.safeParse(weights).success)
        }
        onClick={() => {
          if (userId === null) return;
          setRequest({
            weights: weights || undefined,
            nonce: crypto.randomUUID(),
            language: apiLanguage(locale),
            userId,
          });
        }}
      >
        {query.isFetching ? text.smartBusy : (actionLabel ?? text.smartAction)}
      </Button>
      <WeightsControl
        value={weights}
        onChange={setWeights}
      />
      {activeRequest ? (
        <>
          <QueryFeedback query={query} />
          {query.isPending ? (
            <PropertyGridSkeleton
              count={2}
              className="lg:grid-cols-2"
            />
          ) : query.isError && !query.data ? (
            <ErrorState
              error={query.error}
              retry={() => void query.refetch()}
              retryDisabled={query.isFetching}
            />
          ) : !query.data?.recommendations.length ? (
            <p>{text.noCandidates}</p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {query.data.recommendations.slice(0, 10).map((item) => (
                <PropertyCardView
                  key={`${item.source}:${item.propertyId}`}
                  listing={propertyCardData(
                    {
                      title: item.title,
                      image: item.image,
                      price: item.price,
                      city: item.city,
                      neighborhood: item.neighborhood,
                      bedrooms: item.bedrooms,
                      areaSqm: item.areaSqm,
                    },
                    text.untitled,
                  )}
                  href={propertyHref({
                    source: item.source,
                    externalId: item.propertyId,
                  })}
                  badge={
                    <Badge variant="secondary">
                      {locale === "ar" ? "الترتيب" : "Rank"}{" "}
                      {new Intl.NumberFormat(locale).format(item.rank)}
                    </Badge>
                  }
                  metadata={
                    <>
                      <ScoreFacts
                        match={item.matchScore}
                        housing={item.housingScore}
                        commute={item.commuteScore}
                        services={item.servicesScore}
                      />
                      <SafeMarkdown text={item.aiReason} />
                      {item.aiTradeOff ? (
                        <details>
                          <summary className="cursor-pointer py-2 text-caption text-primary">
                            {locale === "ar"
                              ? "ما الذي ينبغي مراعاته؟"
                              : "What should I consider?"}
                          </summary>
                          <SafeMarkdown text={item.aiTradeOff} />
                        </details>
                      ) : null}
                    </>
                  }
                  footer={
                    <div className="flex w-full flex-col gap-2">
                      <PropertyActions
                        property={{ source: item.source, externalId: item.propertyId }}
                        compact
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          nativeButton={false}
                          render={
                            <Link
                              href={propertyHref({
                                source: item.source,
                                externalId: item.propertyId,
                              })}
                            />
                          }
                        >
                          {text.propertyDetails}
                        </Button>
                        {safeUrl(item.listingUrl) ? (
                          <Button
                            variant="ghost"
                            nativeButton={false}
                            render={
                              <a
                                href={safeUrl(item.listingUrl)!}
                                target="_blank"
                                rel="noopener noreferrer"
                              />
                            }
                          >
                            {locale === "ar" ? "الإعلان الأصلي" : "Original listing"}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
