"use client";

import { useMutation } from "@tanstack/react-query";
import { neighborhood } from "@/lib/api/discovery";
import { GoogleMap } from "@/components/maps/google-map";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { accountSchema, currentHomeSchema, housingPreferenceSchema } from "@/lib/api/contracts";
import { api } from "@/lib/api/endpoints";
import { useHome, useHousing, keys } from "@/features/account/api/hooks";
import { useIdentity } from "./identity";
import { DataForm, DeleteAction, ErrorState, Loading, Panel, PageHeading, type FormField } from "./shared";

const homeFields: FormField[] = [{ name: "latitude", type: "number" }, { name: "longitude", type: "number" }, { name: "externalPropertyId", required: false, maxLength: 150 }, { name: "source", required: false, maxLength: 50 }, { name: "movedInAt", type: "date", required: false }];
function ConfirmMove({ userId }: { userId: number }) {
  const cache = useQueryClient();
  const mutation = useMutation({ mutationFn: () => neighborhood.confirm(userId), onSuccess: () => cache.invalidateQueries({ queryKey: keys.home(userId) }) });
  return <div className="mt-5 flex flex-col gap-3"><Button variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending ? "جارٍ التأكيد…" : "أؤكّد انتقالي إلى المنزل"}</Button>{mutation.isError ? <ErrorState error={mutation.error} /> : mutation.isSuccess ? <p role="status">تم تسجيل تأكيد الانتقال.</p> : null}</div>;
}
export function HomePanel() {
  const t = useTranslations("Workspace"); const { userId } = useIdentity(); const query = useHome(userId); const cache = useQueryClient();
  if (query.isPending) return <Loading />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  const home = query.data;
  return <Panel title={t("currentHome")} description={t("homeIntro")}><DataForm key={home?.id ?? "new"} schema={currentHomeSchema} defaults={home ? { ...home, externalPropertyId: home.externalPropertyId ?? "", source: home.source ?? "", movedInAt: home.movedInAt ?? "" } : { latitude: "", longitude: "", externalPropertyId: "", source: "", movedInAt: "" }} fields={homeFields} onSubmit={async value => {
    // Jackson LocalDate accepts a date or null, never an empty string.
    const body = { latitude: value.latitude, longitude: value.longitude, externalPropertyId: value.externalPropertyId || undefined, source: value.source || undefined, movedInAt: value.movedInAt || undefined };
    if (home?.id) await api.home.update(userId, home.id, body); else await api.home.add(userId, body);
    await cache.invalidateQueries({ queryKey: keys.home(userId) });
  }} />{home?.id ? <><div className="mt-5"><GoogleMap points={[{ id: "home", title: "منزلك الحالي", latitude: home.latitude, longitude: home.longitude }]} /></div><ConfirmMove userId={userId} /></> : null}{home?.id ? <div className="mt-5"><DeleteAction onDelete={async () => { await api.home.remove(userId, home.id!); await cache.invalidateQueries({ queryKey: keys.home(userId) }); }} /></div> : null}</Panel>;
}
export function HousingPanel() {
  const t = useTranslations("Workspace"); const { userId } = useIdentity(); const query = useHousing(userId); const cache = useQueryClient();
  if (query.isPending) return <Loading />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  const pref = query.data;
  return <Panel title={t("housingPreferences")} description={t("housingIntro")}><DataForm key={pref?.id ?? "new"} schema={housingPreferenceSchema} defaults={pref ? { ...pref, district: pref.district ?? "" } : { region: "", city: "", district: "", maxBudget: "", propertyType: "", listingType: "rent" }} fields={[{ name: "region" }, { name: "city", hint: "housingCityHint" }, { name: "district", required: false }, { name: "maxBudget", type: "number", min: 1, hint: "budgetHint" }, { name: "propertyType", options: [{ value: "apartment", label: "شقة" }, { value: "villa", label: "فيلا" }, { value: "floor", label: "دور" }, { value: "duplex", label: "دوبلكس" }, { value: "building", label: "عمارة" }] }, { name: "listingType", options: [{ value: "rent", label: t("rent") }, { value: "sale", label: t("sale") }] }]} onSubmit={async value => {
    if (pref?.id) await api.preferences.update(userId, pref.id, value); else await api.preferences.add(userId, value);
    await cache.invalidateQueries({ queryKey: keys.housing(userId) });
  }} />{pref?.id ? <div className="mt-5"><DeleteAction onDelete={async () => { await api.preferences.remove(userId, pref.id!); await cache.invalidateQueries({ queryKey: keys.housing(userId) }); }} /></div> : null}</Panel>;
}
export function ProfilePage() {
  const t = useTranslations("Workspace"); const { userId, user, logout } = useIdentity(); const cache = useQueryClient();
  return <><PageHeading title={t("profileTitle")} description={user.email} /><div className="grid items-start gap-6 xl:grid-cols-2"><div className="flex flex-col gap-6"><Panel title={t("accountDetails")} description={t("profileIntro")}><DataForm schema={accountSchema} defaults={{ fullName: user.fullName, email: user.email, password: "" }} fields={[{ name: "fullName", maxLength: 100, autoComplete: "name", hint: "nameHint" }, { name: "email", type: "email", autoComplete: "email" }, { name: "password", type: "password", autoComplete: "new-password", maxLength: 64, hint: "passwordHint" }]} onSubmit={async value => { await api.profile.update(userId, value); await cache.invalidateQueries({ queryKey: keys.profile(userId) }); }} /></Panel><HomePanel /></div><div className="flex flex-col gap-6"><HousingPanel /><Panel title={t("deleteAccount")} description={t("deleteAccountHint")}><DeleteAction label={t("deleteAccount")} onDelete={async () => { // The backend does not cascade comparisons when deleting a user.
          const comparisons = await api.comparisons.get(userId);
          for (const pair of comparisons) if (pair.id) await api.comparisons.remove(userId, pair.id);
          await api.profile.remove(userId); await logout(); }} /></Panel></div></div></>;
}
