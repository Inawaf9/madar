"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { useLocalUserId } from "@/features/account/use-local-user-id";
import { useHousing } from "@/features/account/api/hooks";
import { insights } from "@/lib/api/insights";
import { savedPropertiesApi } from "@/lib/api/saved-properties";
import { weightsSchema, type RecommendationWeights } from "@/lib/api/insight-contracts";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { SummarySkeleton } from "@/components/product/page-skeleton";
import { GoogleDataAttribution } from "@/components/maps/google-data-attribution";
import { categoryLabel, straightLineDistance } from "@/lib/maps/place-presentation";
import { QueryFeedback } from "@/components/product/query-feedback";
import { ErrorState } from "@/components/shared/error-state";
import { Panel } from "@/components/shared/panel";
import { ScoreFacts, WeightsControl } from "@/features/product/analysis-ui";
import { Link } from "@/i18n/navigation";

export function PersonalPropertyInsights(props: { source: string; externalId: string }) {
  const userId = useLocalUserId();
  if (!userId) return <p className="text-sm">التحليلات الشخصية اختيارية. <Link href="/login" className="text-primary underline">اختر ملفك المحلي لتفعيلها</Link></p>;
  return <UserPropertyInsights key={`${userId}:${props.source}:${props.externalId}`} userId={userId} {...props} />;
}
function UserPropertyInsights({ userId, source, externalId }: { userId: number; source: string; externalId: string }) {
  const locale = useLocale(); const housing = useHousing(userId);
  const [budget, setBudget] = useState(false); const [scoreRequest, setScoreRequest] = useState<{ weights?: RecommendationWeights } | null>(null); const [weights, setWeights] = useState<RecommendationWeights | null>(null); const [savedRequest, setSavedRequest] = useState(false); const [interestsRequest, setInterestsRequest] = useState(false);
  const affordability = useQuery({ queryKey: ["affordability", userId, source, externalId], queryFn: ({ signal }) => insights.affordability(userId, source, externalId, signal), enabled: budget && !!housing.data, retry: false });
  const match = useQuery({ queryKey: ["match-score", userId, source, externalId, scoreRequest], queryFn: ({ signal }) => insights.match(userId, source, externalId, scoreRequest?.weights, signal), enabled: !!scoreRequest && !!housing.data, retry: false });
  const supportsInterests = source.toUpperCase() === "KITE" && /^\d{1,19}$/.test(externalId);
  const essential = useQuery({ queryKey: ["property-interests", userId, source, externalId], queryFn: ({ signal }) => insights.propertyInterests(userId, source, externalId, signal), enabled: interestsRequest && !!housing.data && supportsInterests, retry: false });
  const saved = useQuery({ queryKey: ["saved-check", userId, source, externalId], queryFn: ({ signal }) => savedPropertiesApi.check(userId, source, externalId, signal), enabled: savedRequest, retry: false });
  return <Panel title="العقار وتفضيلاتك" description="تحليلات اختيارية تستخدم ميزانيتك وبياناتك المحفوظة، ولا تمنع التصفح العام."><div className="flex flex-col gap-4">
    {housing.isPending ? <SummarySkeleton /> : housing.isError && !housing.data ? <ErrorState error={housing.error} retry={() => void housing.refetch()} /> : !housing.data ? <Link href="/profile" className="text-sm text-primary underline">أضف تفضيلات السكن لعرض الميزانية والمطابقة</Link> : <><WeightsControl value={weights} onChange={setWeights} /><div className="flex flex-wrap gap-2"><Button variant="outline" disabled={affordability.isFetching} onClick={() => { if (budget) void affordability.refetch(); else setBudget(true); }}>مقارنة الميزانية</Button><Button variant="outline" disabled={match.isFetching || !!weights && !weightsSchema.safeParse(weights).success} onClick={() => { const next = { weights: weights || undefined }; if (JSON.stringify(next) === JSON.stringify(scoreRequest)) void match.refetch(); else setScoreRequest(next); }}>حساب المطابقة</Button></div></>}
    {budget ? <><QueryFeedback query={affordability} />{affordability.isPending ? <SummarySkeleton /> : affordability.isError && !affordability.data ? <>{affordability.error instanceof ApiError && affordability.error.backendMessage === "Property price is unavailable" ? <p>لا يتوفر سعر صالح لهذا الإعلان؛ تعذّرت مقارنة الميزانية.</p> : null}<ErrorState error={affordability.error} retry={() => void affordability.refetch()} retryDisabled={affordability.isFetching} /></> : affordability.data ? <div className="rounded-xl bg-secondary/50 p-4 text-sm leading-7"><p>{affordability.data.withinBudget ? "ضمن الميزانية" : "يتجاوز الميزانية"}</p><p>السعر: {new Intl.NumberFormat(locale).format(affordability.data.propertyPrice)} ر.س · الميزانية: {new Intl.NumberFormat(locale).format(affordability.data.userBudget)} ر.س</p><p>الفرق (الميزانية − السعر): <bdi>{new Intl.NumberFormat(locale, { signDisplay: "always" }).format(affordability.data.priceDifference)} ر.س</bdi> · {affordability.data.differencePercentage}% من الميزانية</p></div> : null}</> : null}
    {scoreRequest ? <><QueryFeedback query={match} />{match.isPending ? <SummarySkeleton /> : match.isError && !match.data ? <ErrorState error={match.error} retry={() => void match.refetch()} retryDisabled={match.isFetching} /> : match.data ? <ScoreFacts match={match.data.matchScore} housing={match.data.housingScore} commute={match.data.commuteScore} services={match.data.servicesScore} /> : null}</> : null}
    {housing.data && supportsInterests ? <Button variant="outline" className="self-start" disabled={essential.isFetching} onClick={() => { if (interestsRequest) void essential.refetch(); else setInterestsRequest(true); }}>أقرب الخدمات لاهتماماتي حول العقار</Button> : null}
    {interestsRequest ? <><QueryFeedback query={essential} />{essential.isPending ? <SummarySkeleton /> : essential.isError && !essential.data ? <ErrorState error={essential.error} retry={() => void essential.refetch()} retryDisabled={essential.isFetching} /> : !essential.data?.length ? <p className="text-sm">لم تُحدّد اهتمامات في تفضيلات السكن. يمكنك اختيارها من صفحة الاهتمامات.</p> : <ul className="grid gap-3 sm:grid-cols-2">{essential.data.map(item => <li key={item.category} className="rounded-xl border p-3 text-sm"><h3 className="font-medium">{categoryLabel(item.category)}</h3><p className="mt-1 text-xs text-muted-foreground">{item.status === "SEARCH_FAILED" ? "تعذّر البحث لهذا التصنيف. أعد المحاولة." : item.status === "NO_MATCH" ? "لا توجد مطابقة ضمن النتائج المفحوصة." : `${item.place?.displayName?.text || "مكان بدون اسم"} · ${straightLineDistance(item.straightLineDistanceMeters)}`}</p>{item.status === "SEARCH_FAILED" ? <Button variant="link" size="sm" disabled={essential.isFetching} onClick={() => void essential.refetch()}>أعد البحث</Button> : null}</li>)}</ul>}</> : null}
    {essential.data || match.data ? <GoogleDataAttribution /> : null}
    <Button variant="ghost" className="self-start" disabled={saved.isFetching} onClick={() => { if (savedRequest) void saved.refetch(); else setSavedRequest(true); }}>تحقق من حالة الحفظ</Button>
    {savedRequest ? saved.isPending ? <SummarySkeleton /> : saved.isError && saved.data === undefined ? <ErrorState error={saved.error} retry={() => void saved.refetch()} /> : <><QueryFeedback query={saved} /><p role="status" className="text-sm">{saved.data ? "محفوظ لدى الخادم" : "غير محفوظ لدى الخادم"}</p></> : null}
  </div></Panel>;
}
