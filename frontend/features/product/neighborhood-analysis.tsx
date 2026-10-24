"use client";
import { getProductCopy } from "./presentation-copy";
import { useState } from "react";
import { useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { insights } from "@/lib/api/insights";
import { apiLanguage } from "@/lib/api/config";
import { neighborhoodInputSchema, type NeighborhoodInput, type NeighborhoodSuitability } from "@/lib/api/insight-contracts";
import { useLocalUserId } from "@/features/account/use-local-user-id";
import { useHousing } from "@/features/account/api/hooks";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { SummarySkeleton } from "@/components/product/page-skeleton";
import { QueryFeedback } from "@/components/product/query-feedback";
import { GoogleDataAttribution } from "@/components/maps/google-data-attribution";
import { CoordinateField } from "./location-fields";
import { DataForm } from "@/components/forms/data-form";
import { ErrorState } from "@/components/shared/error-state";
import { Panel } from "@/components/shared/panel";
import { ScoreFacts, SafeMarkdown } from "./analysis-ui";
const coordinate = (min: number, max: number) => z.number().min(min).max(max);
const optionalCoordinate = (min: number, max: number) => z.preprocess(value => value === "" || typeof value === "number" && Number.isNaN(value) ? undefined : value, coordinate(min, max).optional());
const schema = neighborhoodInputSchema.extend({ secondLatitude: optionalCoordinate(-90, 90), secondLongitude: optionalCoordinate(-180, 180), secondDistrict: z.string().optional() }).superRefine((v, ctx) => { if (v.secondLatitude !== undefined || v.secondLongitude !== undefined || v.secondDistrict) { for (const key of ["secondLatitude", "secondLongitude"] as const) if (v[key] === undefined) ctx.addIssue({ code: "custom", path: [key], message: "أكمل بيانات الموقع الثاني" }); } });
function NeighborhoodResult({ data }: { data: NeighborhoodSuitability }) {
  const localeForResult = useLocale(); const text = getProductCopy(localeForResult);
  return <article className="flex min-w-0 flex-col gap-4 rounded-xl bg-secondary/30 p-5"><h3 className="font-semibold">{data.district || text.selectedLocation}</h3><p className="text-lg font-semibold tabular-nums">{text.siteScore}: {data.neighborhoodScore} / 100</p><ScoreFacts commute={data.commuteScore} services={data.servicesScore} /><p className="text-xs text-muted-foreground">{data.servicesAvailable ? data.servicesScore === 0 ? text.zeroServices : text.availableServices : text.noServices}</p>{data.commuteAnalysis ? <div className="flex flex-col gap-2 border-t border-border/60 pt-3"><p className="text-xs">{text.weeklyCommute}: {data.commuteAnalysis.totalWeeklyHours} {text.hours}</p><details className="text-xs"><summary className="cursor-pointer rounded-md py-2 text-primary focus-visible:outline-2 focus-visible:outline-ring">{text.commuteDetails}</summary><p className="mt-2">{data.commuteAnalysis.totalWeeklyMinutes} {text.minutes}</p><ul className="mt-2 flex flex-col gap-2">{data.commuteAnalysis.commutes.map(item => <li key={item.placePreferenceId}>{item.placeName} · {item.distanceKm} كم · {item.durationMinutes} {text.minutes} {text.oneWay}</li>)}</ul></details></div> : null}{data.aiAnalysis ? <details><summary className="cursor-pointer py-2 text-sm text-primary">{localeForResult === "ar" ? "اقرأ الشرح" : "Read explanation"}</summary><SafeMarkdown text={data.aiAnalysis} /></details> : null}</article>;
}
export function NeighborhoodAnalysisPanel({ initial }: { initial: NeighborhoodInput }) {
  const text = getProductCopy(useLocale()); const userId = useLocalUserId();
  return userId ? <NeighborhoodAnalysisContent key={userId} userId={userId} initial={initial} /> : <p className="text-sm">{text.chooseProfile}</p>;
}
function NeighborhoodAnalysisContent({ userId, initial }: { userId: number; initial: NeighborhoodInput }) {
  const locale = useLocale(); const text = getProductCopy(locale); const housing = useHousing(userId);
  const [request, setRequest] = useState<{ first: NeighborhoodInput; second?: NeighborhoodInput } | null>(null);
  const result = useQuery({ queryKey: ["neighborhood-analysis", userId, apiLanguage(locale), request], queryFn: async ({ signal }) => request!.second ? { comparison: await insights.compareNeighborhoods(userId, request!.first, request!.second, apiLanguage(locale), signal) } : { single: await insights.neighborhood(userId, request!.first, apiLanguage(locale), signal) }, enabled: !!request && !!housing.data, retry: false });
  return <Panel title={text.siteAnalysis} description={text.siteAnalysisHint}><div className="flex flex-col gap-5"><QueryFeedback query={housing} />{housing.isPending ? <SummarySkeleton /> : housing.isError && !housing.data ? <ErrorState error={housing.error} retry={() => void housing.refetch()} /> : !housing.data ? <Link href="/profile" className="text-primary underline">{text.setupPreferences}</Link> : <DataForm schema={schema} pending={result.isFetching} showSuccess={false} defaults={{ ...initial, district: initial.district || "", secondLatitude: undefined, secondLongitude: undefined, secondDistrict: "" }} fields={[{ name: "latitude", label: locale === "ar" ? "الموقع الذي تريد تقييمه" : "Location to score", fullWidth: true, render: props => <CoordinateField {...props} /> }, { name: "district", required: false, advanced: true, label: locale === "ar" ? "اسم الحي أو الموقع" : "Neighborhood or location name" }, { name: "secondLatitude", required: false, advanced: true, fullWidth: true, label: locale === "ar" ? "موقع ثانٍ للمقارنة" : "Second location to compare", render: props => <div className="flex flex-col gap-2"><CoordinateField {...props} longitudeName="secondLongitude" />{props.value != null ? <Button type="button" variant="ghost" className="self-start" onClick={() => { props.onChange(undefined); props.setValue("secondLongitude", undefined); props.setValue("secondDistrict", ""); }}>{locale === "ar" ? "إزالة الموقع الثاني" : "Remove second location"}</Button> : null}</div> }, { name: "secondDistrict", required: false, advanced: true }]} submitLabel={locale === "ar" ? "عرض التقييم" : "Show scores"} onSubmit={async value => { const next = { first: { latitude: value.latitude, longitude: value.longitude, district: value.district }, second: value.secondLatitude !== undefined && value.secondLongitude !== undefined ? { latitude: value.secondLatitude, longitude: value.secondLongitude, district: value.secondDistrict } : undefined }; if (JSON.stringify(request) === JSON.stringify(next)) await result.refetch(); else setRequest(next); }} />}
    {request ? <><QueryFeedback query={result} />{result.isPending ? <SummarySkeleton /> : result.isError && !result.data ? <ErrorState error={result.error} retry={() => void result.refetch()} retryDisabled={result.isFetching} /> : result.data?.comparison ? <><p role="status" className="rounded-xl bg-secondary/60 p-4 text-sm font-medium">{result.data.comparison.betterNeighborhood === "TIE" ? text.tie : result.data.comparison.betterNeighborhood === "FIRST" ? text.firstBetter : text.secondBetter} · {text.scoreDifference}: {result.data.comparison.scoreDifference}</p><div className="grid gap-4 lg:grid-cols-2"><NeighborhoodResult data={result.data.comparison.firstNeighborhood} /><NeighborhoodResult data={result.data.comparison.secondNeighborhood} /></div></> : result.data?.single ? <NeighborhoodResult data={result.data.single} /> : null}<GoogleDataAttribution /></> : null}
  </div></Panel>;
}
