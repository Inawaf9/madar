"use client";
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PropertyDetailPage } from "@/features/properties/detail-page";
import { SavedDetailSkeleton } from "@/features/properties/skeletons";
import { SavedCardsSkeleton } from "@/components/product/page-skeleton";
import { QueryFeedback } from "@/components/product/query-feedback";
import { TaskDialog } from "@/components/product/task-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { savedPropertySchema } from "@/lib/api/contracts";
import { savedPropertiesApi } from "@/lib/api/saved-properties";
import { useSaved } from "@/features/account/api/hooks";
import { invalidateUserData } from "@/features/account/api/invalidation";
import { SavedPropertyGrid } from "./saved-property-grid";
import { AccountGroupSummary } from "./account-summary";
import { useIdentity } from "@/features/account/identity";
import { DataForm } from "@/components/forms/data-form";
import { DeleteAction } from "@/components/shared/delete-action";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeading } from "@/components/shared/page-heading";

export function SavedPage({ discovery: discoveryPage = false }: { discovery?: boolean }) {
  const t = useTranslations("Workspace"); const ar = useLocale() === "ar"; const { userId } = useIdentity(); const saved = useSaved(userId); const cache = useQueryClient();
  const [filter, setFilter] = useState(""); const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false); const [page, setPage] = useState(0); const [summaryOpen, setSummaryOpen] = useState(false);
  const list = (saved.data || []).filter(p => [p.titleSnapshot, p.source, p.externalPropertyId].some(value => value?.toLocaleLowerCase().includes(filter.toLocaleLowerCase())));
  const pageIndex = Math.min(page, Math.max(0, Math.ceil(list.length / 6) - 1)); const visible = list.slice(pageIndex * 6, (pageIndex + 1) * 6);
  return <><PageHeading title={t(discoveryPage ? "propertiesTitle" : "savedTitle")} description={ar ? "عد إلى خياراتك، أو قارن بينها لاختيار الأنسب." : "Return to your shortlist, or compare options to find your fit."}><Button nativeButton={false} render={<Link href="/properties" />}><Search data-icon="inline-start" />{ar ? "استكشف العقارات" : "Explore properties"}</Button></PageHeading>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><Input type="search" className="w-full sm:max-w-sm" aria-label={t("searchShortlist")} placeholder={t("searchShortlist")} value={filter} onChange={event => { setFilter(event.target.value); setPage(0); }} /><Button variant="ghost" onClick={() => setOpen(true)}>{ar ? "إضافة مرجع يدويًا" : "Add a reference manually"}</Button></div>
    <details open={summaryOpen} onToggle={event => setSummaryOpen(event.currentTarget.open)} className="mb-4 text-sm"><summary className="cursor-pointer rounded-lg py-2 text-muted-foreground">{ar ? "ملخص المحفوظات" : "Saved property summary"}</summary>{summaryOpen ? <AccountGroupSummary kind="saved" /> : null}</details>
    <QueryFeedback query={saved} />{saved.isPending ? <SavedCardsSkeleton /> : saved.isError && !saved.data?.length ? <ErrorState error={saved.error} retry={() => void saved.refetch()} /> : !list.length ? <EmptyState title={t(filter ? "noMatches" : "noSaved")} description={ar ? "احفظ العقارات أثناء الاستكشاف لتجدها هنا." : "Save properties while exploring to find them here."}><Button nativeButton={false} render={<Link href="/properties" />}>{ar ? "استكشف العقارات" : "Explore properties"}</Button></EmptyState> : <section><h2 className="sr-only">{t("saved")}</h2><SavedPropertyGrid properties={visible} /></section>}
    {list.length > 6 ? <nav aria-label={ar ? "صفحات المحفوظات" : "Saved property pages"} className="mt-6 flex flex-wrap items-center justify-between gap-3"><Button variant="outline" disabled={!pageIndex} onClick={() => setPage(pageIndex - 1)}>{ar ? "السابق" : "Previous"}</Button><span className="text-sm text-muted-foreground">{pageIndex + 1} / {Math.ceil(list.length / 6)}</span><Button variant="outline" disabled={(pageIndex + 1) * 6 >= list.length} onClick={() => setPage(pageIndex + 1)}>{ar ? "التالي" : "Next"}</Button></nav> : null}
    <TaskDialog open={open} onOpenChange={setOpen} busy={busy} title={ar ? "إضافة مرجع عقار" : "Add a property reference"} description={t("referenceHint")}><DataForm schema={savedPropertySchema} defaults={{ externalPropertyId: "", source: "", titleSnapshot: "" }} fields={[{ name: "titleSnapshot", required: false, maxLength: 200, fullWidth: true }, { name: "source", maxLength: 50 }, { name: "externalPropertyId", maxLength: 150 }]} onCancel={() => setOpen(false)} onSubmit={async value => { setBusy(true); try { await savedPropertiesApi.add(userId, value); await invalidateUserData(cache, userId); setOpen(false); } finally { setBusy(false); } }} /></TaskDialog>
  </>;
}
export function SavedDetail({ id }: { id: number }) {
  const t = useTranslations("Workspace"); const { userId } = useIdentity(); const query = useSaved(userId); const cache = useQueryClient();
  if (query.isPending) return <SavedDetailSkeleton />;
  if (query.isError && !query.data?.length) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  const property = query.data.find(item => item.id === id);
  if (!property) return <EmptyState title={t("propertyMissing")} description={t("propertyMissingHint")}><Button nativeButton={false} render={<Link href="/saved" />}>{t("saved")}</Button></EmptyState>;
  return <><QueryFeedback query={query} /><nav className="mb-4" aria-label={t("navigation")}><Link href="/saved" className="inline-flex min-h-11 items-center rounded-lg text-sm text-primary underline">{t("saved")}</Link></nav><PropertyDetailPage source={property.source} externalId={property.externalPropertyId} /><details className="mt-6 rounded-xl border border-border/60 p-4"><summary className="cursor-pointer text-sm font-medium">{t("savedReference")}</summary><dl className="my-4 grid gap-4 sm:grid-cols-2"><div><dt className="text-xs text-muted-foreground">{t("fields.source")}</dt><dd className="mt-1 break-all">{property.source}</dd></div><div><dt className="text-xs text-muted-foreground">{t("fields.externalPropertyId")}</dt><dd className="mt-1 break-all">{property.externalPropertyId}</dd></div></dl><div className="flex flex-wrap gap-2"><Button nativeButton={false} render={<Link href={`/compare?first=${property.id}`} />} variant="outline">{t("compare")}</Button><DeleteAction onDelete={async () => { await savedPropertiesApi.remove(userId, id); await invalidateUserData(cache, userId); }} /></div></details></>;
}
