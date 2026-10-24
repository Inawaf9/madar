"use client";
import { getProductCopy } from "./presentation-copy";
import { useState } from "react";
import { useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { insights } from "@/lib/api/insights";
import { apiLanguage } from "@/lib/api/config";
import { weightsSchema, type RecommendationWeights } from "@/lib/api/insight-contracts";
import { useHousing } from "@/features/account/api/hooks";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { PropertyGridSkeleton } from "@/features/properties/skeletons";
import { PropertyCardView } from "@/components/property/property-card-view";
import { propertyCardData } from "@/lib/property-card";
import { Badge } from "@/components/ui/badge";
import { propertyHref } from "@/features/properties/format";
import { QueryFeedback } from "@/components/product/query-feedback";
import { ErrorState } from "@/components/shared/error-state";
import { useIdentity } from "@/features/account/identity";
import { ScoreFacts, WeightsControl, SafeMarkdown } from "./analysis-ui";

export function SmartRecommendationsPanel() {
  const { userId } = useIdentity(); const locale = useLocale(); const text = getProductCopy(locale); const preference = useHousing(userId);
  const [weights, setWeights] = useState<RecommendationWeights | null>(null); const [request, setRequest] = useState<{ weights?: RecommendationWeights } | null>(null);
  const query = useQuery({ queryKey: ["smart", userId, apiLanguage(locale), request], queryFn: ({ signal }) => insights.smart(userId, apiLanguage(locale), request?.weights, signal), enabled: !!request && !!preference.data, retry: false });
  return <section className="flex flex-col gap-4"><h2 className="text-section font-medium">{text.smartTitle}</h2><p className="text-xs leading-6 text-muted-foreground">{text.smartHint}</p>
    <Button className="self-start" disabled={!preference.data || query.isFetching || !!weights && !weightsSchema.safeParse(weights).success} onClick={() => { const next = { weights: weights || undefined }; if (JSON.stringify(next) === JSON.stringify(request)) void query.refetch(); else setRequest(next); }}>{query.isFetching ? text.smartBusy : text.smartAction}</Button><WeightsControl value={weights} onChange={setWeights} />
    {request ? <><QueryFeedback query={query} />{query.isPending ? <PropertyGridSkeleton count={2} className="lg:grid-cols-2" /> : query.isError && !query.data ? <ErrorState error={query.error} retry={() => void query.refetch()} retryDisabled={query.isFetching} /> : !query.data?.recommendations.length ? <p>{text.noCandidates}</p> : <div className="grid gap-4 lg:grid-cols-2">{query.data.recommendations.map(item => <PropertyCardView key={`${item.source}:${item.propertyId}`} listing={propertyCardData({ title: item.title, image: item.image, price: item.price, city: item.city, neighborhood: item.neighborhood }, text.untitled)} href={propertyHref({ source: item.source, externalId: item.propertyId })}
      badge={<Badge variant="secondary">{locale === "ar" ? "الترتيب" : "Rank"} {new Intl.NumberFormat(locale).format(item.rank)}</Badge>}
      metadata={<><ScoreFacts match={item.matchScore} housing={item.housingScore} commute={item.commuteScore} services={item.servicesScore} /><SafeMarkdown text={item.aiReason} />{item.aiTradeOff ? <details><summary className="cursor-pointer py-2 text-caption text-primary">{locale === "ar" ? "ما الذي ينبغي مراعاته؟" : "What should I consider?"}</summary><SafeMarkdown text={item.aiTradeOff} /></details> : null}</>}
      footer={<Button variant="outline" className="w-full" nativeButton={false} render={<Link href={propertyHref({ source: item.source, externalId: item.propertyId })} />}>{text.propertyDetails}</Button>} />)}</div>}</> : null}
  </section>;
}
