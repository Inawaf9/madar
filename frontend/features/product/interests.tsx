"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getLayoutCopy } from "@/components/layout/copy";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { CategorySelector } from "@/components/forms/category-selector";
import { FormPanelSkeleton } from "@/components/product/page-skeleton";
import { QueryFeedback } from "@/components/product/query-feedback";
import { useHousing } from "@/features/account/api/hooks";
import { invalidateUserData } from "@/features/account/api/invalidation";
import { preferencesApi } from "@/lib/api/preferences";
import { housingPreferenceSchema, type HousingPreference } from "@/lib/api/contracts";
import { useIdentity } from "@/features/account/identity";
import { ErrorState } from "@/components/shared/error-state";
import { Panel } from "@/components/shared/panel";
import { PageHeading } from "@/components/shared/page-heading";

export function InterestsPage() {
  const copy = getLayoutCopy(useLocale()); const { userId } = useIdentity(); const query = useHousing(userId);
  return <><PageHeading title={copy.interestsTitle} description={copy.interestsDescription} /><QueryFeedback query={query} />{query.isPending ? <FormPanelSkeleton /> : query.isError && !query.data ? <ErrorState error={query.error} retry={() => void query.refetch()} /> : !query.data?.id ? <Panel title={copy.profileTitle}><p className="mb-3 text-sm">{copy.interestsDescription}</p><Button nativeButton={false} render={<Link href="/profile" />}>{copy.profileTitle}</Button></Panel> : <InterestEditor key={JSON.stringify(query.data)} userId={userId} preference={query.data} />}</>;
}
function InterestEditor({ userId, preference }: { userId: number; preference: HousingPreference }) {
  const cache = useQueryClient(); const locale = useLocale(); const ar = locale === "ar"; const copy = getLayoutCopy(locale);
  const [selected, setSelected] = useState(preference.interests || []);
  const dirty = JSON.stringify([...selected].sort()) !== JSON.stringify([...(preference.interests || [])].sort());
  const body = housingPreferenceSchema.safeParse({ ...preference, district: preference.district || "", interests: selected });
  const mutation = useMutation({ mutationFn: async () => { if (!body.success) throw new Error("Housing setup required"); return preferencesApi.update(userId, preference.id!, body.data); }, onSuccess: async () => { await invalidateUserData(cache, userId); toast.success(ar ? "تم حفظ الاهتمامات" : "Interests saved"); } });
  return <div className="max-w-5xl"><Panel title={copy.servicesTitle}><form className="flex flex-col gap-5" onSubmit={event => { event.preventDefault(); if (body.success && !mutation.isPending) mutation.mutate(); }}><CategorySelector value={selected} disabled={mutation.isPending} onChange={value => { setSelected(value); mutation.reset(); }} />
    {!body.success ? <p role="alert" className="text-sm text-destructive">{ar ? "أكمل بيانات السكن وعدد السكان قبل حفظ الاهتمامات." : "Complete your housing preferences, including occupants, before saving interests."} <Link href="/profile" className="underline">{copy.edit}</Link></p> : null}
    <p className="text-xs text-muted-foreground">{ar ? "يمكنك ترك الاهتمامات فارغة أو تغييرها لاحقًا." : "You can leave interests empty or update them later."}</p>
    {mutation.isError ? <ErrorState error={mutation.error} /> : null}{mutation.isSuccess && !dirty ? <p role="status">{ar ? "تم حفظ الاهتمامات." : "Interests saved."}</p> : null}<div className="flex flex-wrap gap-2 border-t border-border/60 pt-4"><Button disabled={!body.success || mutation.isPending || !dirty} type="submit">{mutation.isPending ? ar ? "جارٍ الحفظ…" : "Saving…" : copy.saveInterests}</Button><Button disabled={mutation.isPending || !selected.length} variant="ghost" onClick={() => setSelected([])} type="button">{copy.clearSelection}</Button></div>
  </form></Panel></div>;
}
