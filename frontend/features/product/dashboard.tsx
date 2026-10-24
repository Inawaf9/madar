"use client";
import { QueryFeedback } from "@/components/product/query-feedback";
import { SavedCardsSkeleton } from "@/components/product/page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { getProductCopy } from "./presentation-copy";
import { ProfileCompletionPanel } from "./profile-completion";
import { AiAssistantPanel } from "./ai-assistant";
import { RecommendationsPanel } from "./recommendations";
import { useLocale, useTranslations } from "next-intl";
import { Bookmark, MapPin, Columns3, ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useSaved, useComparisons, useDashboardSummary } from "@/features/account/api/hooks";
import { useIdentity } from "@/features/account/identity";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeading } from "@/components/shared/page-heading";
import { SavedPropertyGrid } from "./saved-property-grid";
import { HousingPanel } from "./profile";
import { Button } from "@/components/ui/button";
import { getLayoutCopy } from "@/components/layout/copy";

export function DashboardPage() {
  const t = useTranslations("Workspace"); const locale = useLocale(); const copy = getLayoutCopy(locale); const text = getProductCopy(locale);
  const { userId, user } = useIdentity(); const saved = useSaved(userId); const summary = useDashboardSummary(userId); const pairs = useComparisons(userId);
  return <>
    <PageHeading title={t("welcome", { name: user.fullName })} description={t("dashboardIntro")}><Button nativeButton={false} render={<Link href="/properties" />}>{copy.publicSearch}<ArrowUpRight data-icon="inline-end" className="rtl:-scale-x-100" /></Button></PageHeading>
    <QueryFeedback query={summary} /><QueryFeedback query={pairs} />
    {summary.isError && !summary.data ? <div className="mb-4"><ErrorState error={summary.error} retry={() => void summary.refetch()} /></div> : null}
    {pairs.isError && !pairs.data ? <div className="mb-4"><ErrorState error={pairs.error} retry={() => void pairs.refetch()} /></div> : null}
    <section aria-label={copy.summary} className="mb-6 grid gap-3 sm:grid-cols-3">
      {[{ label: "saved", href: "/saved", query: summary, count: summary.data?.savedPropertiesCount, Icon: Bookmark }, { label: "locations", href: "/locations", query: summary, count: summary.data?.importantLocationsCount, Icon: MapPin }, { label: "compare", href: "/compare", query: pairs, count: pairs.data?.length, Icon: Columns3 }].map(({ label, href, query, count, Icon }) => <div key={href} className="min-w-0 rounded-xl bg-secondary/35 p-4">
        <Link href={href} className="group flex items-start justify-between gap-3 rounded-lg outline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"><div><p className="text-sm text-muted-foreground">{t(label)}</p><div className="mt-1 text-xl font-semibold tabular-nums">{query.isPending ? <Skeleton className="h-9 w-12" /> : typeof count === "number" ? new Intl.NumberFormat(locale).format(count) : "—"}</div></div><span className="flex size-9 items-center justify-center rounded-xl bg-secondary/70 text-primary"><Icon className="size-4" /></span><ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 rtl:-scale-x-100 motion-reduce:transform-none" /></Link>
      </div>)}
    </section>
    <div className="grid items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="min-w-0"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-section font-medium">{copy.recentSaved}</h2><Link href="/saved" className="rounded-md text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">{t("viewAll")}</Link></div>
        <QueryFeedback query={saved} />{saved.isPending ? <SavedCardsSkeleton /> : saved.isError && !saved.data?.length ? <ErrorState error={saved.error} retry={() => void saved.refetch()} /> : !saved.data.length ? <EmptyState title={t("noSaved")} description={t("noSavedHint")}><Button nativeButton={false} render={<Link href="/properties" />}>{copy.publicSearch}</Button></EmptyState> : <SavedPropertyGrid properties={saved.data.slice(0, 4)} />}
      </section>
      <aside className="flex min-w-0 flex-col gap-4"><ProfileCompletionPanel /><HousingPanel />{summary.data ? <Link href="/neighborhood" className="rounded-xl bg-secondary/35 p-4 text-sm text-primary underline-offset-4 hover:underline">{summary.data.currentHomeStatus === "NO_HOME" ? text.homeMissing : summary.data.currentHomeStatus === "PENDING_MOVE" ? text.homePending : text.homeMoved}</Link> : null}</aside>
    </div>
    <div className="mt-6"><RecommendationsPanel /></div>
    <details className="mt-6 rounded-xl border border-border/60 p-4"><summary className="cursor-pointer text-sm font-medium">{locale === "ar" ? "المساعد — اختياري" : "Assistant — optional"}</summary><div className="mt-4"><AiAssistantPanel /></div></details>
  </>;
}
