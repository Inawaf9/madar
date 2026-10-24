"use client";
import { getProductCopy } from "./presentation-copy";
import { QueryFeedback } from "@/components/product/query-feedback";
import { SummarySkeleton, ListSkeleton } from "@/components/product/page-skeleton";
import { useLocale } from "next-intl";
import { getLayoutCopy } from "@/components/layout/copy";
import { useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { neighborhood } from "@/lib/api/neighborhood";
import { categories, type GooglePlace, type EssentialResult } from "@/lib/api/discovery-contracts";
import { useHome, useHomeStatus, useHousing } from "@/features/account/api/hooks";
import { useIdentity } from "@/features/account/identity";
import { NeighborhoodAnalysisPanel } from "./neighborhood-analysis";
import { HomePanel } from "./profile";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeading } from "@/components/shared/page-heading";
import { Panel } from "@/components/shared/panel";
import { MadarMap } from "@/components/maps/madar-map";
import { GoogleDataAttribution } from "@/components/maps/google-data-attribution";
import { categoryLabel, placeCategory, straightLineDistance } from "@/lib/maps/place-presentation";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchableSelect } from "@/components/forms/searchable-select";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function NeighborhoodPage() {
  const locale = useLocale(); const copy = getLayoutCopy(locale); const text = getProductCopy(locale); const { userId } = useIdentity(); const home = useHome(userId); const status = useHomeStatus(userId);
  return <div className="flex flex-col gap-6"><PageHeading title={copy.homeTitle} description={copy.homeDescription} />
    <HomePanel showMap={false} />
    {home.isPending || status.isPending || (home.isError && !home.data) || (status.isError && !status.data) ? null : status.data?.status !== "MOVED_IN" || !home.data ? <p className="rounded-xl bg-secondary/50 p-5 text-sm">{text.homeSetup}</p> : <NeighborhoodData key={`${home.data.id}:${home.data.movedInAt}`} userId={userId} home={home.data as { latitude: number; longitude: number }} />}
  </div>;
}
function NeighborhoodData({ userId, home }: { userId: number; home: { latitude: number; longitude: number } }) {
  const id = useId(); const locale = useLocale(); const text = getProductCopy(locale); const label = (category: string) => locale === "ar" ? categoryLabel(category) : category.replaceAll("_", " ");
  const preference = useHousing(userId);
  const [view, setView] = useState<"map" | "services">("services");
  const overview = useQuery({ queryKey: ["neighborhood", userId, home.latitude, home.longitude], queryFn: ({ signal }) => neighborhood.overview(userId, signal), retry: false });
  const [mode, setMode] = useState<"category" | "text" | "essentials">("category");
  const [category, setCategory] = useState<string>("supermarket"); const [query, setQuery] = useState(""); const [radius, setRadius] = useState("2000");
  const [request, setRequest] = useState<{ kind: "category" | "text" | "essentials"; term: string; radius: number } | null>(null);
  const results = useQuery({ queryKey: ["neighborhood-search", userId, home.latitude, home.longitude, request], queryFn: async ({ signal }) => {
    if (request!.kind === "essentials") return { places: [] as GooglePlace[], essentials: await neighborhood.essentials(userId, request!.radius, signal), distances: [] as { place: GooglePlace; straightLineDistanceMeters: number }[] };
    if (request!.kind === "text") { const distances = await neighborhood.search(userId, request!.term, request!.radius, signal); return { places: distances.map(item => item.place), essentials: [] as EssentialResult[], distances }; }
    const data = await neighborhood.category(userId, request!.term, request!.radius, signal); return { places: data.places?.filter(p => p != null) || [], essentials: [] as EssentialResult[], distances: [] as { place: GooglePlace; straightLineDistanceMeters: number }[] };
  }, enabled: request !== null, retry: false });
  const search = (kind: "category" | "text" | "essentials") => { if (kind === "essentials" && !preference.data) return; if (!(Number(radius) > 0 && Number(radius) <= 50000) || (kind === "text" && !query.trim())) return; const next = { kind, term: kind === "category" ? category : query.trim(), radius: Number(radius) }; if (JSON.stringify(request) === JSON.stringify(next)) void results.refetch(); else setRequest(next); };
  const listed = results.data?.places || overview.data?.places || [];
  return <div className="flex flex-col gap-6">
    <Tabs value={view} onValueChange={value => setView(value as "map" | "services")}><TabsList className="h-auto max-w-full flex-wrap p-1"><TabsTrigger className="min-h-11 px-4" value="services">{text.servicesView}</TabsTrigger><TabsTrigger className="min-h-11 px-4" value="map">{text.homeLocation}</TabsTrigger></TabsList>
    <TabsContent value="map"><MadarMap label={text.homeLocation} points={[{ id: "home", title: text.homeLocation, ...home, provenance: "user", kind: "home" }]} /></TabsContent><TabsContent value="services" className="flex flex-col gap-6">
    <QueryFeedback query={overview} />{overview.isPending ? <SummarySkeleton /> : overview.isError && !overview.data ? <ErrorState error={overview.error} retry={() => void overview.refetch()} /> : <Panel title={text.overview} description={`${overview.data.places.length} ${text.returnedPlaces} · ${text.withinMeters} ${overview.data.radiusMeters}. ${text.partialCoverage}`}><div className="flex flex-wrap gap-3">{overview.data.categories.map(c => <span key={c.category} className="rounded-full bg-secondary px-3 py-2 text-xs">{label(c.category)}: {c.returnedCount}</span>)}</div></Panel>}
    <Panel title={text.discoverServices}><div className="flex flex-col gap-5">
      <Tabs value={mode} onValueChange={value => setMode(value as "category" | "text" | "essentials")}><TabsList className="h-auto w-full flex-wrap justify-start gap-1 p-1"><TabsTrigger value="category" className="min-h-11 px-3">{text.category}</TabsTrigger><TabsTrigger value="text" className="min-h-11 px-3">{locale === "ar" ? "بالاسم" : "By name"}</TabsTrigger><TabsTrigger value="essentials" className="min-h-11 px-3">{locale === "ar" ? "اهتماماتي" : "My interests"}</TabsTrigger></TabsList>
      <FieldGroup className="mt-4 max-w-lg"><TabsContent value="category"><Field><FieldLabel htmlFor={`${id}-category`}>{text.category}</FieldLabel><SearchableSelect id={`${id}-category`} value={category} options={categories.map(value => ({ value, label: label(value) }))} onChange={value => { setCategory(value); setRequest(null); }} /></Field></TabsContent><TabsContent value="text"><Field><FieldLabel htmlFor={`${id}-query`}>{text.query}</FieldLabel><Input id={`${id}-query`} dir="auto" value={query} onChange={event => { setQuery(event.target.value); setRequest(null); }} /></Field></TabsContent><TabsContent value="essentials"><p className="text-sm text-muted-foreground">{locale === "ar" ? "ابحث عن أقرب الخدمات وفق اهتماماتك المحفوظة." : "Find nearby services for your saved interests."}</p></TabsContent></FieldGroup></Tabs>
      <details className="max-w-lg rounded-xl bg-secondary/30 p-4"><summary className="cursor-pointer text-sm">{locale === "ar" ? "نطاق البحث" : "Search radius"} · {new Intl.NumberFormat(locale).format(Number(radius) || 0)} {locale === "ar" ? "متر" : "m"}</summary><label className="mt-4 flex flex-col gap-2 text-sm">{text.radius}<Input type="number" inputMode="numeric" min="1" max="50000" aria-invalid={!(Number(radius) > 0 && Number(radius) <= 50000)} value={radius} onChange={event => { setRadius(event.target.value); setRequest(null); }} /></label>{!(Number(radius) > 0 && Number(radius) <= 50000) ? <p role="alert" className="mt-2 text-xs text-destructive">{locale === "ar" ? "اختر نطاقًا بين 1 و50,000 متر." : "Choose a radius between 1 and 50,000 meters."}</p> : null}</details>
      <Button className="self-start" disabled={results.isFetching || !(Number(radius) > 0 && Number(radius) <= 50000) || (mode === "text" && !query.trim()) || (mode === "essentials" && !preference.data)} onClick={() => search(mode)}>{results.isFetching ? locale === "ar" ? "جارٍ البحث…" : "Searching…" : locale === "ar" ? "ابحث عن الخدمات" : "Find services"}</Button>
      <QueryFeedback query={preference} />{preference.isError && !preference.data ? <ErrorState error={preference.error} retry={() => void preference.refetch()} /> : !preference.isPending && !preference.data ? <Link href="/profile" className="text-sm text-primary underline">{text.setupInterests}</Link> : null}
      <QueryFeedback query={results} />{request && results.isPending ? <ListSkeleton kind="services" /> : results.isError && !results.data ? <ErrorState error={results.error} retry={() => void results.refetch()} /> : null}
      {results.data?.essentials.map(item => <article key={item.category} className="rounded-xl bg-secondary/50 p-4 text-sm"><b>{label(item.category)}</b><p>{item.status === "SEARCH_FAILED" ? text.searchFailed : item.status === "NO_MATCH" ? text.noMatch : `${item.place?.displayName?.text || "مكان"} — ${straightLineDistance(item.straightLineDistanceMeters)}`}</p>{item.status === "SEARCH_FAILED" ? <Button variant="outline" disabled={results.isFetching} onClick={() => void results.refetch()}>{text.retry}</Button> : null}</article>)}
      {!results.isError && results.isSuccess && !results.data.places.length && !results.data.essentials.length ? <p>{text.noResults}</p> : null}
    </div></Panel>
    <ul className="grid gap-3 lg:grid-cols-2">{listed.map((p, i) => <li key={p.id || i} className="min-w-0 rounded-xl border border-border/60 bg-card p-4 text-sm"><b>{p.displayName?.text || text.unnamed}</b><p className="mt-1 text-xs leading-5 text-muted-foreground">{p.formattedAddress}</p><p className="mt-2 text-xs text-muted-foreground">{placeCategory(p)} · {straightLineDistance(results.data?.distances.find(d => d.place === p || (!!p.id && d.place.id === p.id))?.straightLineDistanceMeters)}</p></li>)}</ul>
    {overview.data || results.data ? <GoogleDataAttribution /> : null}<NeighborhoodAnalysisPanel initial={{ latitude: home.latitude, longitude: home.longitude }} />
    </TabsContent></Tabs>
  </div>;
}
