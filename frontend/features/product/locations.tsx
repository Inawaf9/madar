"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { MapPin, Plus } from "lucide-react";
import { MadarMap } from "@/components/maps/madar-map";
import { TaskDialog } from "@/components/product/task-dialog";
import { QueryFeedback } from "@/components/product/query-feedback";
import { ListSkeleton, MapSkeleton } from "@/components/product/page-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { placeSchema, type PlacePreference } from "@/lib/api/contracts";
import { invalidateUserData } from "@/features/account/api/invalidation";
import { placesApi } from "@/lib/api/places";
import { usePlaces } from "@/features/account/api/hooks";
import { ChoiceCards } from "@/components/forms/choice-cards";
import type { FormFieldRenderProps } from "@/components/forms/data-form";
import { SearchableSelect } from "@/components/forms/searchable-select";
import { AccountGroupSummary } from "./account-summary";
import { useIdentity } from "@/features/account/identity";
import { CoordinateField } from "./location-fields";
import { DataForm, type FormField } from "@/components/forms/data-form";
import { DeleteAction } from "@/components/shared/delete-action";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeading } from "@/components/shared/page-heading";

export function LocationsPage() {
  const ar = useLocale() === "ar"; const t = useTranslations("Workspace"); const { userId } = useIdentity(); const query = usePlaces(userId); const cache = useQueryClient();
  const [open, setOpen] = useState(false); const [edit, setEdit] = useState<PlacePreference | null>(null); const [busy, setBusy] = useState(false); const [mapOpen, setMapOpen] = useState(false); const [filter, setFilter] = useState(""); const [summaryOpen, setSummaryOpen] = useState(false);
  const refresh = () => invalidateUserData(cache, userId);
  const add = () => { setEdit(null); setOpen(true); };
  const list = (query.data || []).filter(place => `${place.name} ${place.type}`.toLocaleLowerCase().includes(filter.toLocaleLowerCase()));
  const fields: FormField[] = [
    { name: "name", maxLength: 100, fullWidth: true },
    { name: "type", maxLength: 50, fullWidth: true, label: ar ? "الغرض من المكان" : "Purpose of this place", description: ar ? "اختر من أغراضك السابقة أو اكتب وصفًا مناسبًا." : "Choose a previous purpose or enter your own.", render: props => <SearchableSelect {...props} value={String(props.value || "")} options={[...new Set((query.data || []).map(p => p.type))].map(value => ({ value, label: value }))} onChange={props.onChange} allowCustom /> },
    { name: "latitude", label: ar ? "الموقع" : "Location", fullWidth: true, render: props => <CoordinateField {...props} presets={(query.data || []).map(place => ({ ...place, id: String(place.id) }))} /> },
    { name: "visitPerWeek", label: ar ? "عدد الزيارات في الأسبوع" : "Visits per week", control: "stepper", type: "number" },
    { name: "importance", fullWidth: true, advanced: true, render: props => <ImportanceChoice {...props} /> },
  ];
  const importance: FormField = { name: "importance", fullWidth: true, render: props => <ImportanceChoice {...props} /> };
  return <><PageHeading title={t("locationsTitle")} description={ar ? "الأماكن التي تتردد عليها، لتقييم تنقلك من أي عقار." : "The places you visit, for commute analysis from any property."}><Button onClick={add}><Plus data-icon="inline-start" />{t("addLocation")}</Button></PageHeading>
    <QueryFeedback query={query} /><details open={summaryOpen} onToggle={event => setSummaryOpen(event.currentTarget.open)} className="mb-4 text-sm"><summary className="cursor-pointer rounded-lg py-2 text-muted-foreground">{ar ? "ملخص الأماكن" : "Places summary"}</summary>{summaryOpen ? <AccountGroupSummary kind="places" /> : null}</details>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><Input type="search" aria-label={ar ? "ابحث في أماكنك" : "Search your places"} placeholder={ar ? "ابحث في أماكنك" : "Search your places"} className="w-full sm:max-w-sm" value={filter} onChange={e => setFilter(e.target.value)} /><Button variant="ghost" disabled={!query.data?.length} aria-pressed={mapOpen} onClick={() => setMapOpen(value => !value)}><MapPin data-icon="inline-start" />{mapOpen ? ar ? "إخفاء الخريطة" : "Hide map" : ar ? "عرض الخريطة" : "Show map"}</Button></div>
    {mapOpen ? <div className="mb-6">{query.isPending ? <MapSkeleton /> : <MadarMap label={t("locations")} points={(query.data || []).map(place => ({ id: String(place.id), title: place.name, latitude: place.latitude, longitude: place.longitude, provenance: "user", kind: "destination", description: place.type }))} />}</div> : null}
    {query.isPending ? <ListSkeleton /> : query.isError && !query.data?.length ? <ErrorState error={query.error} retry={() => void query.refetch()} /> : !list.length ? <EmptyState title={t(filter ? "noMatches" : "noLocations")} description={ar ? "أضف مكانًا وحدد موقعه على الخريطة." : "Add a place and choose its location on the map."}><Button onClick={add}>{t("addLocation")}</Button></EmptyState> : <div className="grid gap-3 lg:grid-cols-2">{list.map(place => <article key={place.id} className="flex min-w-0 flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary/60"><MapPin className="size-4 text-primary" /></span><div className="min-w-0 flex-1"><h2 className="font-semibold wrap-break-word">{place.name}</h2><p className="mt-1 text-sm text-muted-foreground">{place.type}</p></div></div><p className="text-sm text-muted-foreground">{t("visits", { count: place.visitPerWeek })} · {ar ? "الأهمية" : "Importance"} {place.importance}/5</p><div className="mt-auto flex flex-wrap items-center gap-2"><Button variant="outline" onClick={() => { setEdit(place); setOpen(true); }}>{t("edit")}</Button><DeleteAction onDelete={async () => { await placesApi.remove(userId, place.id!); await refresh(); }} /></div><details className="text-xs text-muted-foreground"><summary className="cursor-pointer py-1">{ar ? "خيارات إضافية" : "Additional options"}</summary><p dir="ltr" className="my-3">{place.latitude}, {place.longitude}</p><DataForm schema={placeSchema.pick({ importance: true })} defaults={{ importance: place.importance }} fields={[importance]} onSubmit={async value => { await placesApi.importance(userId, place.id!, value.importance); await refresh(); }} /></details></article>)}</div>}
    <TaskDialog open={open} onOpenChange={setOpen} busy={busy} title={t(edit ? "editLocation" : "addLocation")} description={ar ? "سمّ المكان وحدد غرضه وموقعه وعدد زياراتك الأسبوعية." : "Give the place a name, purpose, location and weekly visit count."}>
      <DataForm key={edit?.id ?? "new"} schema={placeSchema} defaults={edit || { name: "", type: "", latitude: "", longitude: "", importance: 3, visitPerWeek: 1 }} fields={fields} onCancel={() => setOpen(false)} onSubmit={async value => { setBusy(true); try { if (edit) await placesApi.update(userId, edit.id!, value); else await placesApi.add(userId, value); await refresh(); setOpen(false); } finally { setBusy(false); } }} />
    </TaskDialog>
  </>;
}
function ImportanceChoice(props: FormFieldRenderProps) {
  const ar = useLocale() === "ar";
  return <ChoiceCards {...props} value={String(props.value ?? "")} options={[1,2,3,4,5].map(value => ({ value: String(value), label: `${value}${value === 1 ? ar ? " · أقل" : " · Low" : value === 5 ? ar ? " · أعلى" : " · High" : ""}` }))} onChange={value => props.onChange(Number(value))} />;
}
