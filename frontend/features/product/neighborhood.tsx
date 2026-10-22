"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { neighborhood } from "@/lib/api/discovery";
import { categories, type GooglePlace, type EssentialResult } from "@/lib/api/discovery-contracts";
import { useHome } from "@/features/account/api/hooks";
import { useIdentity } from "./identity";
import { HomePanel } from "./profile";
import { ErrorState, Loading, PageHeading, Panel } from "./shared";
import { GoogleMap } from "@/components/maps/google-map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NeighborhoodPage() {
  const { userId } = useIdentity(); const home = useHome(userId);
  return <div className="flex flex-col gap-8"><PageHeading title="منزلك وحيّك" description="خدمات حقيقية حول منزلك بعد إعلان الانتقال إليه. المسافات المعروضة خط مستقيم وليست زمن قيادة." />
    <HomePanel />
    {home.isPending ? <Loading /> : home.isError ? <ErrorState error={home.error} retry={() => void home.refetch()} /> : !home.data?.movedInAt ? <p className="rounded-2xl border bg-card p-5">أضف منزلك وأكّد الانتقال لتفعيل خدمات الحي.</p> : <NeighborhoodData key={`${home.data.id}:${home.data.movedInAt}`} userId={userId} home={home.data as { latitude: number; longitude: number }} />}
  </div>;
}
function NeighborhoodData({ userId, home }: { userId: number; home: { latitude: number; longitude: number } }) {
  const overview = useQuery({ queryKey: ["neighborhood", userId, home.latitude, home.longitude], queryFn: ({ signal }) => neighborhood.overview(userId, signal), retry: false });
  const [category, setCategory] = useState<string>("supermarket"); const [query, setQuery] = useState(""); const [radius, setRadius] = useState("2000");
  const [request, setRequest] = useState<{ kind: "category" | "text" | "essentials"; term: string; radius: number } | null>(null);
  const results = useQuery({ queryKey: ["neighborhood-search", userId, home.latitude, home.longitude, request], queryFn: async ({ signal }) => {
    if (request!.kind === "essentials") return { places: [] as GooglePlace[], essentials: await neighborhood.essentials(userId, request!.radius, signal), distances: [] as { place: GooglePlace; straightLineDistanceMeters: number }[] };
    if (request!.kind === "text") { const distances = await neighborhood.search(userId, request!.term, request!.radius, signal); return { places: distances.map(item => item.place), essentials: [] as EssentialResult[], distances }; }
    const data = await neighborhood.category(userId, request!.term, request!.radius, signal); return { places: data.places?.filter(p => p != null) || [], essentials: [] as EssentialResult[], distances: [] as { place: GooglePlace; straightLineDistanceMeters: number }[] };
  }, enabled: request !== null, retry: false });
  const search = (kind: "category" | "text" | "essentials") => { if (!(Number(radius) > 0 && Number(radius) <= 50000) || (kind === "text" && !query.trim())) return; const next = { kind, term: kind === "category" ? category : query.trim(), radius: Number(radius) }; if (JSON.stringify(request) === JSON.stringify(next)) void results.refetch(); else setRequest(next); };
  const listed = results.data?.places || overview.data?.places || [];
  const found = results.data?.essentials.filter(item => item.status === "FOUND" && item.place).map(item => item.place!) || [];
  return <div className="flex flex-col gap-6">
    {overview.isPending ? <Loading /> : overview.isError ? <ErrorState error={overview.error} retry={() => void overview.refetch()} /> : <Panel title="نظرة على الحي" description={`${overview.data.places.length} مواقع أعادها المزوّد ضمن ${overview.data.radiusMeters} متر؛ ليست إحصاءً كاملًا.`}><div className="flex flex-wrap gap-3">{overview.data.categories.map(c => <span key={c.category} className="rounded-full bg-secondary px-3 py-2 text-xs">{c.category}: {c.returnedCount}</span>)}</div></Panel>}
    <Panel title="اكتشف الخدمات حولك"><div className="flex flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm">نطاق البحث بالمتر (حتى ٥٠٬٠٠٠)<Input type="number" min="1" max="50000" value={radius} onChange={e => { setRadius(e.target.value); setRequest(null); }} /></label>
      <label className="flex flex-col gap-2 text-sm">التصنيف<select value={category} onChange={e => { setCategory(e.target.value); setRequest(null); }} className="h-11 rounded-xl border bg-background px-3">{categories.map(c => <option key={c}>{c}</option>)}</select></label>
      <label className="flex flex-col gap-2 text-sm">اسم مكان أو خدمة<Input dir="auto" value={query} onChange={e => { setQuery(e.target.value); setRequest(null); }} /></label>
      <div className="flex flex-wrap gap-2"><Button disabled={results.isFetching || !(Number(radius) > 0 && Number(radius) <= 50000)} onClick={() => search("category")}>بحث بالتصنيف</Button><Button variant="outline" disabled={results.isFetching || !query.trim() || !(Number(radius) > 0 && Number(radius) <= 50000)} onClick={() => search("text")}>بحث نصي</Button><Button variant="outline" disabled={results.isFetching || !(Number(radius) > 0 && Number(radius) <= 50000)} onClick={() => search("essentials")}>أقرب الخدمات لاهتماماتي</Button></div>
      {request && results.isPending ? <Loading /> : results.isError ? <ErrorState error={results.error} retry={() => void results.refetch()} /> : null}
      {results.data?.essentials.map(item => <article key={item.interest.id} className="rounded-xl border p-3 text-sm"><b>{item.interest.name}</b><p>{item.status === "SEARCH_FAILED" ? "تعذّر البحث عن هذا الاهتمام؛ أعد المحاولة." : item.status === "NO_MATCH" ? "لا توجد مطابقة ضمن النتائج المتاحة." : `${item.place?.displayName?.text || "مكان"} — ${item.straightLineDistanceMeters} متر بخط مستقيم`}</p></article>)}
      {results.isSuccess && !results.data.places.length && !results.data.essentials.length ? <p>لم تُرجع الخدمة نتائج. قد لا توجد اهتمامات محفوظة عند اختيار بحث الاهتمامات.</p> : null}
    </div></Panel>
    <GoogleMap points={[{ id: "home", title: "منزلك الحالي", ...home }, ...[...listed, ...found].map((p, i) => ({ id: p.id || String(i), title: p.displayName?.text || "مكان", latitude: p.location?.latitude ?? null, longitude: p.location?.longitude ?? null, description: p.formattedAddress }))]} />
    <ul className="flex flex-col gap-2">{listed.map((p, i) => <li key={p.id || i} className="rounded-xl border bg-card p-4 text-sm"><b>{p.displayName?.text || "اسم غير متاح"}</b><p className="text-muted-foreground">{p.formattedAddress}</p>{results.data?.distances.find(d => d.place.id === p.id) ? <p>{results.data.distances.find(d => d.place.id === p.id)!.straightLineDistanceMeters} متر بخط مستقيم</p> : null}</li>)}</ul>
  </div>;
}
