"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { discovery } from "@/lib/api/discovery";
import { useHousing } from "@/features/account/api/hooks";
import { useIdentity } from "./identity";
import { ErrorState, Loading, Panel } from "./shared";
import { PropertyCard } from "@/features/properties/property-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function RecommendationsPanel() {
  const { userId } = useIdentity(); const preferences = useHousing(userId); const [kind, setKind] = useState<"by-preferences" | "within-budget" | "under-budget" | null>(null); const [margin, setMargin] = useState("1"); const [submittedMargin, setSubmittedMargin] = useState(0); const [summary, setSummary] = useState(false); const [stats, setStats] = useState(false);
  const query = useQuery({ queryKey: ["recommendations", userId, kind, submittedMargin, preferences.data], queryFn: ({ signal }) => kind === "under-budget" ? discovery.underBudget(userId, submittedMargin, signal) : discovery.personalized(kind!, userId, signal), enabled: !!kind && !!preferences.data, retry: false });
  const match = useQuery({ queryKey: ["match-summary", userId, preferences.data], queryFn: ({ signal }) => discovery.match(userId, signal), enabled: summary && !!preferences.data, retry: false });
  const market = useQuery({ queryKey: ["market-stats", preferences.data], queryFn: ({ signal }) => discovery.stats(preferences.data!.city, preferences.data!.listingType, preferences.data!.propertyType, signal), enabled: stats && !!preferences.data, retry: false });
  return <Panel title="خيارات وفق تفضيلاتك" description="التخصيص اختياري ويعتمد على بيانات السكن المحفوظة. هذه نتائج أولية محدودة لدى المزوّد وليست ترتيبًا بحسب التنقل."><div className="flex flex-col gap-5">
    {preferences.isPending ? <Loading /> : preferences.isError ? <ErrorState error={preferences.error} retry={() => void preferences.refetch()} /> : !preferences.data ? <p>احفظ تفضيلاتك في الملف الشخصي لتفعيل هذه الخيارات، أو تابع البحث العام.</p> : <><div className="flex flex-wrap gap-2"><Button onClick={() => setKind("by-preferences")}>حسب التفضيلات</Button><Button variant="outline" onClick={() => setKind("within-budget")}>ضمن الميزانية</Button><Button variant="outline" onClick={() => setSummary(true)}>ملخص المطابقة</Button><Button variant="outline" onClick={() => setStats(true)}>إحصاءات السوق لهذا النوع</Button></div><label className="flex flex-col gap-2 text-sm">هامش أقل من الميزانية — ر.س<Input type="number" min="1" max="2147483647" value={margin} onChange={e => setMargin(e.target.value)} /></label><Button variant="outline" disabled={!Number.isInteger(Number(margin)) || Number(margin) <= 0 || Number(margin) > 2147483647 || Number(margin) >= Math.trunc(preferences.data?.maxBudget || 0)} onClick={() => { setSubmittedMargin(Number(margin)); setKind("under-budget"); }}>اعرض ضمن الهامش</Button></>}
    {kind ? query.isPending ? <Loading /> : query.isError ? <ErrorState error={query.error} retry={() => void query.refetch()} /> : query.data?.length ? <div className="grid gap-5 md:grid-cols-2">{query.data.map((p, i) => <PropertyCard key={`${p.source}:${p.externalId || i}`} property={p} />)}</div> : <p>لا توجد نتائج في الدفعة المتاحة.</p> : null}
    {summary ? match.isPending ? <Loading /> : match.isError ? <ErrorState error={match.error} retry={() => void match.refetch()} /> : match.data ? <p>الميزانية: {match.data.budget} ر.س · النتائج: {match.data.totalListings} · في الحي: {match.data.inMyDistrict ?? "غير محدد"} · أقل سعر متاح: {match.data.cheapestPrice ?? "غير متاح"}</p> : null : null}
    {stats ? market.isPending ? <Loading /> : market.isError ? <ErrorState error={market.error} retry={() => void market.refetch()} /> : market.data ? <p>إحصاءات هذا النوع: {market.data.totalListings} إعلان · أقل سعر: {market.data.minPrice ?? "غير متاح"} · أعلى سعر: {market.data.maxPrice ?? "غير متاح"} ر.س. أسعار الإيجار سنوية.</p> : null : null}
  </div></Panel>;
}
