"use client";

import { ComparisonListings } from "./comparison-listings";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { z } from "zod";
import { Link } from "@/i18n/navigation";
import { useComparisons, useSaved, keys } from "@/features/account/api/hooks";
import { api } from "@/lib/api/endpoints";
import type { PropertyComparison, SavedProperty } from "@/lib/api/contracts";
import { useIdentity } from "./identity";
import { DataForm, DeleteAction, EmptyState, ErrorState, Loading, PageHeading, Panel } from "./shared";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

const pairSchema = z.object({ first: z.string().min(1), second: z.string().min(1) }).refine(v => v.first !== v.second, { path: ["second"] });
const referenceValue = (source: string, id: string) => JSON.stringify([source, id]);
function PairForm({ pair, onSaved }: { pair?: PropertyComparison; onSaved?: () => void }) {
  const t = useTranslations("Workspace"); const { userId } = useIdentity(); const saved = useSaved(userId); const cache = useQueryClient(); const params = useSearchParams();
  if (saved.isPending) return <Loading />;
  if (saved.isError) return <ErrorState error={saved.error} retry={() => void saved.refetch()} />;
  const options = saved.data.map(p => ({ value: referenceValue(p.source, p.externalPropertyId), label: `${p.titleSnapshot || p.externalPropertyId} · ${p.source}` }));
  if (pair) for (const [source, id] of [[pair.firstPropertySource, pair.firstPropertyId], [pair.secondPropertySource, pair.secondPropertyId]]) { const value = referenceValue(source, id); if (!options.some(o => o.value === value)) options.push({ value, label: `${id} · ${source}` }); }
  const initial = saved.data.find(p => String(p.id) === params.get("first"));
  if (options.length < 2) return <EmptyState title={t("needTwoProperties")} description={t("needTwoPropertiesHint")}><Button nativeButton={false} render={<Link href="/saved" />}>{t("addProperty")}</Button></EmptyState>;
  return <DataForm schema={pairSchema} defaults={{ first: pair ? referenceValue(pair.firstPropertySource, pair.firstPropertyId) : initial ? referenceValue(initial.source, initial.externalPropertyId) : options[0].value, second: pair ? referenceValue(pair.secondPropertySource, pair.secondPropertyId) : "" }} fields={[{ name: "first", options }, { name: "second", options: [{ value: "", label: t("chooseProperty") }, ...options] }]} onSubmit={async value => {
    const [firstPropertySource, firstPropertyId] = JSON.parse(value.first) as [string, string]; const [secondPropertySource, secondPropertyId] = JSON.parse(value.second) as [string, string];
    const body = { firstPropertySource, firstPropertyId, secondPropertySource, secondPropertyId };
    if (pair?.id) await api.comparisons.update(userId, pair.id, body); else await api.comparisons.add(userId, body);
    await cache.invalidateQueries({ queryKey: keys.comparisons(userId) });
    if (pair?.id) await cache.invalidateQueries({ queryKey: ["comparison", userId, pair.id] });
    onSaved?.();
  }} />;
}
function ComparisonTable({ pair, saved }: { pair: PropertyComparison; saved: SavedProperty[] }) {
  const t = useTranslations("Workspace");
  const first = saved.find(p => p.source === pair.firstPropertySource && p.externalPropertyId === pair.firstPropertyId); const second = saved.find(p => p.source === pair.secondPropertySource && p.externalPropertyId === pair.secondPropertyId);
  return <div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[440px] border-collapse text-start text-sm"><caption className="sr-only">{t("comparisonTable")}</caption><thead className="bg-muted"><tr><th scope="col" className="p-4 text-start">{t("characteristic")}</th><th scope="col" className="p-4 text-start">{t("fields.first")}</th><th scope="col" className="p-4 text-start">{t("fields.second")}</th></tr></thead><tbody>{[[t("fields.titleSnapshot"), first?.titleSnapshot || t("untitledProperty"), second?.titleSnapshot || t("untitledProperty")], [t("fields.source"), pair.firstPropertySource, pair.secondPropertySource], [t("fields.externalPropertyId"), pair.firstPropertyId, pair.secondPropertyId]].map(([label, a, b]) => <tr key={label} className="border-t"><th scope="row" className="p-4 text-start font-medium">{label}</th><td className="max-w-60 break-words p-4">{a}</td><td className="max-w-60 break-words p-4">{b}</td></tr>)}</tbody></table></div>;
}
export function ComparisonsPage() {
  const t = useTranslations("Workspace"); const { userId } = useIdentity(); const query = useComparisons(userId); const saved = useSaved(userId); const cache = useQueryClient();
  return <><PageHeading title={t("comparisonsTitle")} description={t("comparisonIntro")} /><div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"><section className="flex min-w-0 flex-col gap-5">{query.isPending ? <Loading /> : query.isError ? <ErrorState error={query.error} retry={() => void query.refetch()} /> : !query.data.length ? <EmptyState title={t("noComparisons")} description={t("noComparisonsHint")} /> : query.data.map(pair => <Card key={pair.id}><CardHeader><CardTitle>{t("comparisonPair")}</CardTitle><CardDescription>{t("referenceComparisonHint")}</CardDescription></CardHeader><CardContent><ComparisonTable pair={pair} saved={saved.data ?? []} /></CardContent><CardFooter className="flex flex-wrap gap-2"><Button variant="outline" nativeButton={false} render={<Link href={`/compare/${pair.id}`} />}>{t("viewEdit")}</Button><DeleteAction onDelete={async () => { await api.comparisons.remove(userId, pair.id!); await cache.invalidateQueries({ queryKey: keys.comparisons(userId) }); }} /></CardFooter></Card>)}</section><Panel title={t("createComparison")}><PairForm /></Panel></div></>;
}
export function ComparisonDetail({ id }: { id: number }) {
  const t = useTranslations("Workspace"); const { userId } = useIdentity(); const query = useQuery({ queryKey: ["comparison", userId, id], queryFn: ({ signal }) => api.comparisons.detail(userId, id, signal) }); const saved = useSaved(userId);
  if (query.isPending) return <Loading />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  return <><PageHeading title={t("comparisonPair")} description={t("referenceComparisonHint")} /><div className="flex max-w-4xl flex-col gap-6"><ComparisonTable pair={query.data} saved={saved.data ?? []} /><ComparisonListings pair={query.data} /><Panel title={t("editComparison")}><PairForm key={JSON.stringify(query.data)} pair={query.data} /></Panel></div></>;
}
