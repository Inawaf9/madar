"use client";

import { RecommendationsPanel } from "./recommendations";
import { useTranslations } from "next-intl";
import { Bookmark, MapPin, Columns3, ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useSaved, usePlaces, useComparisons } from "@/features/account/api/hooks";
import { useIdentity } from "./identity";
import { ErrorState, EmptyState, Loading, PageHeading, Panel } from "./shared";
import { PropertyCard } from "./saved";
import { HousingPanel } from "./profile";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export function DashboardPage() {
  const t = useTranslations("Workspace"); const { userId, user } = useIdentity(); const saved = useSaved(userId); const places = usePlaces(userId); const pairs = useComparisons(userId);
  return <><PageHeading title={t("welcome", { name: user.fullName })} description={t("dashboardIntro")}><Button size="lg" nativeButton={false} render={<Link href="/properties" />}>{t("organizeProperties")}<ArrowUpRight data-icon="inline-end" className="rtl:-scale-x-100" /></Button></PageHeading><div className="mb-8 grid gap-4 md:grid-cols-3">{[{ label: "saved", href: "/saved", query: saved, Icon: Bookmark }, { label: "locations", href: "/locations", query: places, Icon: MapPin }, { label: "compare", href: "/compare", query: pairs, Icon: Columns3 }].map(({ label, href, query, Icon }) => <Card key={href}><CardHeader><div className="mb-2 flex items-center justify-between"><Icon className="size-5 text-primary" /><span className="text-2xl font-semibold">{query.isSuccess ? query.data.length : "—"}</span></div><CardTitle>{t(label)}</CardTitle><CardDescription>{t(`${label}Summary`)}</CardDescription></CardHeader><CardContent>{query.isError ? <ErrorState error={query.error} retry={() => void query.refetch()} /> : null}</CardContent><CardFooter><Button variant="outline" nativeButton={false} render={<Link href={href} />}>{t("open")}<ArrowUpRight data-icon="inline-end" className="rtl:-scale-x-100" /></Button></CardFooter></Card>)}</div><div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_380px]"><section><div className="mb-5 flex items-center justify-between gap-3"><h2 className="font-heading text-xl font-semibold">{t("yourShortlist")}</h2><Link href="/saved" className="text-sm underline underline-offset-4">{t("viewAll")}</Link></div>{saved.isPending ? <Loading /> : saved.isError ? <ErrorState error={saved.error} retry={() => void saved.refetch()} /> : !saved.data.length ? <EmptyState title={t("noSaved")} description={t("noSavedHint")}><Button nativeButton={false} render={<Link href="/saved" />}>{t("addProperty")}</Button></EmptyState> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">{saved.data.slice(0, 4).map(p => <PropertyCard key={p.id} property={p} />)}</div>}<div className="mt-6"><Panel title={t("dailyLife")} description={t("dailyLifeHint")}><Button variant="outline" nativeButton={false} render={<Link href="/locations" />}>{t("addLocation")}</Button></Panel></div></section><HousingPanel /></div><div className="mt-8"><RecommendationsPanel /></div></>;
}
