"use client";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useIdentity } from "@/features/account/identity";
import { useProfileCompletion } from "@/features/account/api/hooks";
import { SummarySkeleton } from "@/components/product/page-skeleton";
import { QueryFeedback } from "@/components/product/query-feedback";
import { getLayoutCopy } from "@/components/layout/copy";
import { ErrorState } from "@/components/shared/error-state";
import { Panel } from "@/components/shared/panel";
const missingLinks: Record<string, { key: string; href: string }> = {
  HOUSING_PREFERENCE: { key: "housingPreference.missing", href: "/profile" }, IMPORTANT_LOCATIONS: { key: "importantLocations.missing", href: "/locations" }, INTERESTS: { key: "interests.missing", href: "/interests" },
};
export function ProfileCompletionPanel() {
  const locale = useLocale(); const copy = getLayoutCopy(locale); const { userId } = useIdentity(); const query = useProfileCompletion(userId); const t = useTranslations("profile");
  if (query.isPending) return <SummarySkeleton />;
  if (query.isError && !query.data) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  return <Panel title={copy.profileProgress}><QueryFeedback query={query} />
    <div className="mb-3 flex items-center justify-between gap-3 text-sm"><span className="text-muted-foreground">{copy.summary}</span><span className="font-semibold tabular-nums">{new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }).format(query.data.completionPercentage / 100)}</span></div>
    <progress aria-label={copy.profileProgress} value={query.data.completionPercentage} max={100} className="mb-3 h-1.5 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-secondary [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary" />
    <p className="mb-4 text-xs leading-5 text-muted-foreground">{query.data.readyForSearch ? copy.completionReady : copy.completionOptional}</p>
    <ul className="flex flex-col gap-2">{query.data.missingFeatures.map(item => { const feature = missingLinks[item.feature]; return feature && item.messageKey === `profile.${feature.key}` ? <li key={item.feature}><Link href={feature.href} className="inline-flex min-h-9 items-center rounded-lg text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">{t(feature.key)}</Link></li> : <li key={item.feature} className="text-sm"><Link href="/profile" className="text-primary underline">{copy.profileTitle}</Link></li>; })}</ul></Panel>;
}
