"use client";

import { useState } from "react";
import { GoogleMap } from "@/components/maps/google-map";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { placeSchema, type PlacePreference } from "@/lib/api/contracts";
import { api } from "@/lib/api/endpoints";
import { usePlaces, keys } from "@/features/account/api/hooks";
import { useIdentity } from "./identity";
import { DataForm, DeleteAction, EmptyState, ErrorState, Loading, Panel, PageHeading, type FormField } from "./shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export const placeFields: FormField[] = [{ name: "name", maxLength: 100 }, { name: "type", maxLength: 50, hint: "placeTypeHint" }, { name: "latitude", type: "number", min: -90, max: 90, hint: "latitudeHint" }, { name: "longitude", type: "number", min: -180, max: 180, hint: "longitudeHint" }, { name: "importance", type: "number", min: 1, max: 5, hint: "importanceHint" }, { name: "visitPerWeek", type: "number", hint: "visitsHint" }];
export function LocationsPage() {
  const t = useTranslations("Workspace"); const { userId } = useIdentity(); const query = usePlaces(userId); const cache = useQueryClient(); const [edit, setEdit] = useState<PlacePreference | null>(null); const [formVersion, setFormVersion] = useState(0);
  const refresh = () => cache.invalidateQueries({ queryKey: keys.places(userId) });
  return <><PageHeading title={t("locationsTitle")} description={t("locationsIntro")} /><div className="mb-6"><GoogleMap label="أماكنك المهمة" points={(query.data || []).map(p => ({ id: String(p.id), title: p.name, latitude: p.latitude, longitude: p.longitude, description: p.type }))} /></div><div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_390px]"><section className="flex flex-col gap-4">{query.isPending ? <Loading /> : query.isError ? <ErrorState error={query.error} retry={() => void query.refetch()} /> : !query.data.length ? <EmptyState title={t("noLocations")} description={t("noLocationsHint")} /> : query.data.map(place => <Card key={place.id}><CardHeader><div className="flex items-center justify-between gap-3"><MapPin className="size-5 text-primary" /><Badge variant="outline">{place.type}</Badge></div><CardTitle className="break-words">{place.name}</CardTitle><CardDescription>{t("visits", { count: place.visitPerWeek })}</CardDescription></CardHeader><CardContent><dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-muted-foreground">{t("fields.latitude")}</dt><dd dir="ltr" className="mt-1 text-start">{place.latitude}</dd></div><div><dt className="text-muted-foreground">{t("fields.longitude")}</dt><dd dir="ltr" className="mt-1 text-start">{place.longitude}</dd></div></dl><details className="mt-5"><summary className="cursor-pointer text-sm font-medium">{t("changeImportance", { value: place.importance })}</summary><div className="mt-4"><DataForm schema={placeSchema.pick({ importance: true })} defaults={{ importance: place.importance }} fields={[placeFields[4]]} onSubmit={async value => { await api.places.importance(userId, place.id!, value.importance); await refresh(); }} /></div></details></CardContent><CardFooter className="flex gap-2"><Button variant="outline" onClick={() => { setEdit(place); document.getElementById("location-form")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>{t("edit")}</Button><DeleteAction onDelete={async () => { await api.places.remove(userId, place.id!); if (edit?.id === place.id) setEdit(null); await refresh(); }} /></CardFooter></Card>)}</section><div id="location-form" className="scroll-mt-24"><Panel title={t(edit ? "editLocation" : "addLocation")} description={t("coordinateHint")}><DataForm key={`${edit?.id ?? "new"}-${formVersion}`} schema={placeSchema} defaults={edit ?? { name: "", type: "", latitude: "", longitude: "", importance: 3, visitPerWeek: 1 }} fields={placeFields} onCancel={edit ? () => setEdit(null) : undefined} onSubmit={async value => { if (edit) await api.places.update(userId, edit.id!, value); else await api.places.add(userId, value); await refresh(); setEdit(null); setFormVersion(v => v + 1); }} /></Panel></div></div></>;
}
