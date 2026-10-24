"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { House, MapPin, SlidersHorizontal, UserRound } from "lucide-react";
import { QueryFeedback } from "@/components/product/query-feedback";
import { SummaryPanelSkeleton } from "@/components/product/page-skeleton";
import { TaskDialog } from "@/components/product/task-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MadarMap } from "@/components/maps/madar-map";
import { neighborhood } from "@/lib/api/neighborhood";
import { accountSchema, currentHomeSchema, housingPreferenceSchema, type CurrentHome, type HousingPreference } from "@/lib/api/contracts";
import { profileApi } from "@/lib/api/account";
import { homeApi } from "@/lib/api/current-home";
import { preferencesApi } from "@/lib/api/preferences";
import { comparisonsApi } from "@/lib/api/comparisons";
import { invalidateUserData } from "@/features/account/api/invalidation";
import { useHome, useHousing, useHomeStatus, usePlaces } from "@/features/account/api/hooks";
import { useIdentity } from "@/features/account/identity";
import { DataForm, type FormField } from "@/components/forms/data-form";
import { DeleteAction } from "@/components/shared/delete-action";
import { ErrorState } from "@/components/shared/error-state";
import { Panel } from "@/components/shared/panel";
import { PageHeading } from "@/components/shared/page-heading";
import { CategorySelector } from "@/components/forms/category-selector";
import { CoordinateField, HousingCityField, HousingDistrictField, HousingRegionField } from "./location-fields";
import { getProductCopy } from "./presentation-copy";
import { ProfileCompletionPanel } from "./profile-completion";

function ConfirmMove({ userId }: { userId: number }) {
  const copy = getProductCopy(useLocale()); const cache = useQueryClient();
  const mutation = useMutation({ mutationFn: () => neighborhood.confirm(userId), onSuccess: () => invalidateUserData(cache, userId) });
  return <div className="mt-4 flex flex-col gap-3"><Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending ? copy.confirming : copy.confirmMove}</Button>{mutation.isError ? <ErrorState error={mutation.error} /> : mutation.isSuccess ? <p role="status" className="text-sm text-primary">{copy.moveConfirmed}</p> : null}</div>;
}
export function HomePanel({ showMap = true }: { showMap?: boolean }) {
  const locale = useLocale(); const ar = locale === "ar"; const copy = getProductCopy(locale); const t = useTranslations("Workspace");
  const { userId } = useIdentity(); const query = useHome(userId); const status = useHomeStatus(userId); const places = usePlaces(userId); const cache = useQueryClient();
  const [open, setOpen] = useState(false); const [snapshot, setSnapshot] = useState<CurrentHome | null>(null); const [busy, setBusy] = useState(false); const [mapOpen, setMapOpen] = useState(false);
  if (query.isPending || status.isPending) return <SummaryPanelSkeleton />;
  if (status.isError && !status.data) return <ErrorState error={status.error} retry={() => void status.refetch()} />;
  if (query.isError && !query.data) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  const home = query.data;
  const fields: FormField[] = [
    { name: "latitude", label: ar ? "موقع المنزل" : "Home location", fullWidth: true, render: props => <CoordinateField {...props} presets={(places.data || []).map(p => ({ ...p, id: String(p.id) }))} /> },
    { name: "movedInAt", type: "date", required: false },
    { name: "externalPropertyId", required: false, maxLength: 150, advanced: true }, { name: "source", required: false, maxLength: 50, advanced: true },
  ];
  return <Panel title={t("currentHome")}><QueryFeedback query={query} /><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-secondary"><House className="size-5 text-primary" /></span><p className="text-sm">{status.data?.status === "NO_HOME" ? copy.homeMissing : status.data?.status === "PENDING_MOVE" ? copy.homePending : copy.homeMoved}</p></div><Button variant={home ? "outline" : "default"} onClick={() => { setSnapshot(home || null); setOpen(true); }}>{home ? t("edit") : ar ? "أضف منزلك" : "Add your home"}</Button></div>
    {home?.id && status.data?.status === "PENDING_MOVE" ? <ConfirmMove userId={userId} /> : null}
    {showMap && home ? <details open={mapOpen} onToggle={event => setMapOpen(event.currentTarget.open)} className="mt-4"><summary className="cursor-pointer rounded-lg py-2 text-sm text-primary">{ar ? "عرض المنزل على الخريطة" : "View home on map"}</summary>{mapOpen ? <MadarMap points={[{ ...home, id: "home", title: t("currentHome"), provenance: "user", kind: "home" }]} /> : null}</details> : null}
    <TaskDialog open={open} onOpenChange={setOpen} busy={busy} title={home ? t("currentHome") : ar ? "أضف منزلك" : "Add your home"} description={ar ? "حدد موقع المنزل. تاريخ الانتقال والمرجع اختياريان." : "Choose your home location. Move-in date and listing reference are optional."}>
      <DataForm schema={currentHomeSchema} defaults={snapshot ? { ...snapshot, externalPropertyId: snapshot.externalPropertyId || "", source: snapshot.source || "", movedInAt: snapshot.movedInAt || "" } : { latitude: "", longitude: "", movedInAt: "", externalPropertyId: "", source: "" }} fields={fields} onCancel={() => setOpen(false)} onSubmit={async value => {
        setBusy(true); try { const body = { latitude: value.latitude, longitude: value.longitude, externalPropertyId: value.externalPropertyId || undefined, source: value.source || undefined, movedInAt: value.movedInAt || undefined };
          if (snapshot?.id) await homeApi.update(userId, snapshot.id, body); else await homeApi.add(userId, body);
          await invalidateUserData(cache, userId); setOpen(false);
        } finally { setBusy(false); }
      }} />
      {snapshot?.id ? <div className="border-t border-border/60 pt-4"><DeleteAction onDelete={async () => { await homeApi.remove(userId, snapshot.id!); await invalidateUserData(cache, userId); setOpen(false); }} /></div> : null}
    </TaskDialog>
  </Panel>;
}
export function HousingPanel() {
  const ar = useLocale() === "ar"; const t = useTranslations("Workspace"); const { userId } = useIdentity(); const query = useHousing(userId); const cache = useQueryClient();
  const [open, setOpen] = useState(false); const [snapshot, setSnapshot] = useState<HousingPreference | null>(null); const [busy, setBusy] = useState(false);
  if (query.isPending) return <SummaryPanelSkeleton />;
  if (query.isError && !query.data) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  const pref = query.data;
  const types = [{ value: "apartment", label: ar ? "شقة" : "Apartment" }, { value: "villa", label: ar ? "فيلا" : "Villa" }, { value: "floor", label: ar ? "دور" : "Floor" }, { value: "duplex", label: ar ? "دوبلكس" : "Duplex" }, { value: "building", label: ar ? "عمارة" : "Building" }];
  const fields: FormField[] = [
    { name: "listingType", options: [{ value: "rent", label: t("rent") }, { value: "sale", label: t("sale") }], control: "choices", fullWidth: true },
    { name: "propertyType", options: types, control: "choices", fullWidth: true },
    { name: "city", render: props => <HousingCityField {...props} /> }, { name: "region", maxLength: 100, render: props => <HousingRegionField {...props} /> },
    { name: "maxBudget", type: "number", min: 1, unit: "SAR", description: ar ? "للإيجار: الميزانية السنوية. للبيع: السعر الإجمالي." : "Rent: annual budget. Purchase: total price." },
    { name: "occupantsCount", control: "stepper", type: "number", min: 1, max: 2147483647 },
    { name: "district", required: false, advanced: true, fullWidth: true, render: props => <HousingDistrictField {...props} /> },
    { name: "interests", label: ar ? "الخدمات التي تهمك" : "Services that matter", required: false, advanced: true, fullWidth: true, render: props => <CategorySelector value={Array.isArray(props.value) ? props.value : []} onChange={props.onChange} /> },
  ];
  return <Panel title={t("housingPreferences")}><QueryFeedback query={query} /><div className="flex flex-wrap items-center justify-between gap-4"><div className="min-w-0"><p className="text-sm font-medium">{pref ? [types.find(type => type.value === pref.propertyType)?.label || pref.propertyType, t(pref.listingType)].join(" · ") : ar ? "ما الذي تبحث عنه في منزلك القادم؟" : "What matters in your next home?"}</p>{pref ? <p className="mt-2 text-sm text-muted-foreground"><bdi>{pref.city}</bdi> · {new Intl.NumberFormat(ar ? "ar" : "en", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(pref.maxBudget)} {pref.listingType === "rent" ? ar ? "سنويًا" : "per year" : ""}</p> : <p className="mt-2 text-sm text-muted-foreground">{ar ? "اختر نوع السكن والمدينة والميزانية." : "Choose your property type, city and budget."}</p>}</div><Button variant={pref ? "outline" : "default"} onClick={() => { setSnapshot(pref || null); setOpen(true); }}>{pref ? t("edit") : ar ? "إعداد التفضيلات" : "Set preferences"}</Button></div>
    <TaskDialog open={open} onOpenChange={setOpen} busy={busy} title={t("housingPreferences")} description={ar ? "اختياراتك الحالية محفوظة ويمكن تعديلها متى رغبت." : "Your current choices are saved and can be updated anytime."}>
      <DataForm schema={housingPreferenceSchema} defaults={snapshot ? { ...snapshot, district: snapshot.district || "", occupantsCount: snapshot.occupantsCount ?? "", interests: snapshot.interests || [] } : { region: "", city: "", district: "", maxBudget: "", occupantsCount: "", interests: [], propertyType: "", listingType: "rent" }} fields={fields} onCancel={() => setOpen(false)} onSubmit={async value => {
        setBusy(true); try { const body = housingPreferenceSchema.parse(value);
          if (snapshot?.id) await preferencesApi.update(userId, snapshot.id, body); else await preferencesApi.add(userId, body);
          await invalidateUserData(cache, userId); setOpen(false);
        } finally { setBusy(false); }
      }} />
      {snapshot?.id ? <div className="border-t border-border/60 pt-4"><DeleteAction onDelete={async () => { await preferencesApi.remove(userId, snapshot.id!); await invalidateUserData(cache, userId); setOpen(false); }} /></div> : null}
    </TaskDialog>
  </Panel>;
}
function AccountSettings() {
  const ar = useLocale() === "ar"; const t = useTranslations("Workspace"); const { userId, user, logout } = useIdentity(); const cache = useQueryClient(); const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false);
  return <div className="flex max-w-3xl flex-col gap-6"><Panel title={t("accountDetails")}><div className="flex flex-wrap items-center justify-between gap-4"><div className="min-w-0"><p className="font-medium">{user.fullName}</p><p className="mt-1 truncate text-sm text-muted-foreground"><bdi>{user.email}</bdi></p></div><Button variant="outline" onClick={() => setOpen(true)}>{t("edit")}</Button></div></Panel>
    <TaskDialog open={open} onOpenChange={setOpen} busy={busy} title={t("accountDetails")}>
      <DataForm schema={accountSchema} defaults={{ fullName: user.fullName, email: user.email, password: "" }} fields={[{ name: "fullName", maxLength: 100, autoComplete: "name", fullWidth: true }, { name: "email", type: "email", autoComplete: "email", fullWidth: true }, { name: "password", type: "password", autoComplete: "new-password", maxLength: 64, hint: "passwordHint", fullWidth: true }]} onCancel={() => setOpen(false)} onSubmit={async value => { setBusy(true); try { await profileApi.update(userId, value); await invalidateUserData(cache, userId); setOpen(false); } finally { setBusy(false); } }} />
    </TaskDialog>
    <details className="rounded-xl border border-destructive/20 p-4"><summary className="cursor-pointer text-sm font-medium text-destructive">{ar ? "إدارة الحساب وحذفه" : "Account management and deletion"}</summary><p className="my-4 text-sm text-muted-foreground">{t("deleteAccountHint")}</p><DeleteAction label={t("deleteAccount")} onDelete={async () => {
      const comparisons = await comparisonsApi.get(userId);
      for (const pair of comparisons) if (pair.id) await comparisonsApi.remove(userId, pair.id);
      await profileApi.remove(userId); await logout();
    }} /></details></div>;
}
export function ProfilePage() {
  const ar = useLocale() === "ar";
  return <><PageHeading title={ar ? "ملفك وتفضيلاتك" : "Your profile and preferences"} description={ar ? "خصص تجربة السكن بما يناسب حياتك." : "Make your housing experience fit your life."} /><div className="mb-6 max-w-3xl"><ProfileCompletionPanel /></div>
    <Tabs defaultValue="housing" className="gap-6"><TabsList className="h-auto w-full flex-wrap justify-start gap-1 p-1 sm:w-fit"><TabsTrigger value="housing" className="min-h-11"><SlidersHorizontal />{ar ? "السكن" : "Housing"}</TabsTrigger><TabsTrigger value="home" className="min-h-11"><MapPin />{ar ? "المنزل" : "Home"}</TabsTrigger><TabsTrigger value="account" className="min-h-11"><UserRound />{ar ? "الحساب" : "Account"}</TabsTrigger></TabsList><TabsContent value="housing" className="max-w-3xl"><HousingPanel /></TabsContent><TabsContent value="home" className="max-w-3xl"><HomePanel /></TabsContent><TabsContent value="account"><AccountSettings /></TabsContent></Tabs>
  </>;
}
