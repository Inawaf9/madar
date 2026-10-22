"use client";

import { useState } from "react";
import { PropertyDetailPage } from "@/features/properties/detail-page";
import { useTranslations, useLocale } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { Bookmark, ArrowUpRight, Columns3 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useSaved, keys } from "@/features/account/api/hooks";
import { savedPropertySchema, type SavedProperty } from "@/lib/api/contracts";
import { api } from "@/lib/api/endpoints";
import { useIdentity } from "./identity";
import { DataForm, DeleteAction, EmptyState, ErrorState, Loading, PageHeading, Panel } from "./shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function PropertyCard({ property }: { property: SavedProperty }) {
  const t = useTranslations("Workspace"); const locale = useLocale(); const { userId } = useIdentity(); const cache = useQueryClient();
  return <Card className="overflow-hidden"><CardHeader><div className="mb-3 flex items-center justify-between gap-2"><span className="grid size-11 place-items-center rounded-2xl bg-muted text-primary"><Bookmark className="size-5" /></span><Badge variant="secondary">{property.source}</Badge></div><CardTitle className="break-words"><bdi>{property.titleSnapshot || t("untitledProperty")}</bdi></CardTitle><CardDescription className="break-all">{t("listingReference", { value: property.externalPropertyId })}</CardDescription></CardHeader><CardContent><p className="text-xs text-muted-foreground">{property.savedAt && !Number.isNaN(Date.parse(property.savedAt)) ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(property.savedAt)) : t("savedReference")}</p></CardContent><CardFooter className="flex flex-wrap gap-2"><Button nativeButton={false} render={<Link href={`/properties/${property.id}`} />}>{t("view")}<ArrowUpRight data-icon="inline-end" className="rtl:-scale-x-100" /></Button><Button variant="outline" nativeButton={false} render={<Link href={`/compare?first=${property.id}`} />}><Columns3 data-icon="inline-start" />{t("compare")}</Button><DeleteAction onDelete={async () => { await api.savedProperties.remove(userId, property.id!); await cache.invalidateQueries({ queryKey: keys.saved(userId) }); }} /></CardFooter></Card>;
}
export function SavedPage({ discovery = false }: { discovery?: boolean }) {
  const t = useTranslations("Workspace"); const { userId } = useIdentity(); const saved = useSaved(userId); const cache = useQueryClient(); const [filter, setFilter] = useState("");
  const list = (saved.data ?? []).filter(p => [p.titleSnapshot, p.source, p.externalPropertyId].some(v => v?.toLocaleLowerCase().includes(filter.toLocaleLowerCase())));
  return <><PageHeading title={t(discovery ? "propertiesTitle" : "savedTitle")} description={t("savedIntro")}><Button size="lg" onClick={() => document.getElementById("save-property-form")?.scrollIntoView({ behavior: "smooth", block: "start" })}>{t("addProperty")}</Button></PageHeading><div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]"><section className="flex min-w-0 flex-col gap-5"><div className="rounded-[1.375rem] border bg-card p-5 shadow-stone"><Field><FieldLabel htmlFor="shortlist-search">{t("searchShortlist")}</FieldLabel><Input id="shortlist-search" type="search" className="h-11" value={filter} onChange={e => setFilter(e.target.value)} /></Field></div>{saved.isPending ? <Loading /> : saved.isError ? <ErrorState error={saved.error} retry={() => void saved.refetch()} /> : !list.length ? <EmptyState title={t(filter ? "noMatches" : "noSaved")} description={t("noSavedHint")} /> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">{list.map(p => <PropertyCard key={p.id} property={p} />)}</div>}</section><div id="save-property-form" className="scroll-mt-24"><Panel title={t("addProperty")} description={t("referenceHint")}><DataForm schema={savedPropertySchema} defaults={{ externalPropertyId: "", source: "", titleSnapshot: "" }} fields={[{ name: "titleSnapshot", required: false, maxLength: 200 }, { name: "source", maxLength: 50 }, { name: "externalPropertyId", maxLength: 150 }]} onSubmit={async value => { await api.savedProperties.add(userId, value); await cache.invalidateQueries({ queryKey: keys.saved(userId) }); }} /></Panel></div></div></>;
}
export function SavedDetail({ id }: { id: number }) {
  const t = useTranslations("Workspace"); const { userId } = useIdentity(); const query = useSaved(userId); const cache = useQueryClient();
  if (query.isPending) return <Loading />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  const p = query.data.find(item => item.id === id);
  if (!p) return <EmptyState title={t("propertyMissing")} description={t("propertyMissingHint")}><Button nativeButton={false} render={<Link href="/saved" />}>{t("saved")}</Button></EmptyState>;
  return <><PageHeading title={p.titleSnapshot || t("untitledProperty")} description={t("referenceDetailsHint")} /><div className="max-w-3xl"><Panel title={t("savedReference")}><dl className="grid gap-6 sm:grid-cols-2"><div><dt className="text-sm text-muted-foreground">{t("fields.source")}</dt><dd className="mt-2 break-words font-medium">{p.source}</dd></div><div><dt className="text-sm text-muted-foreground">{t("fields.externalPropertyId")}</dt><dd className="mt-2 break-all font-medium">{p.externalPropertyId}</dd></div></dl><div className="mt-8 flex flex-wrap gap-3"><Button nativeButton={false} render={<Link href={`/compare?first=${p.id}`} />}>{t("compare")}</Button><DeleteAction onDelete={async () => { await api.savedProperties.remove(userId, id); await cache.invalidateQueries({ queryKey: keys.saved(userId) }); }} /></div></Panel></div><div className="mt-8"><PropertyDetailPage source={p.source} externalId={p.externalPropertyId} /></div></>;
}
