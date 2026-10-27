"use client";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useIdentity } from "@/features/account/identity";
import { useProfileCompletion } from "@/features/account/api/query-hooks";
import { SummarySkeleton } from "@/components/shared/page-skeleton";
import { QueryFeedback } from "@/components/shared/query-feedback";
import { getLayoutCopy } from "@/messages/layout-copy";
import { ErrorState } from "@/components/shared/error-state";
import { Panel } from "@/components/shared/panel";
export function ProfileCompletionPanel() {
  const locale = useLocale();
  const copy = getLayoutCopy(locale);
  const { userId } = useIdentity();
  const query = useProfileCompletion(userId);
  const t = useTranslations("profile");
  if (query.isPending) return <SummarySkeleton />;
  if (query.isError && !query.data)
    return (
      <ErrorState
        error={query.error}
        retry={() => void query.refetch()}
      />
    );
  const steps = [
    {
      title: locale === "ar" ? "تفضيلات السكن" : "Housing preferences",
      href: "/profile",
      done: query.data.housingCompleted,
    },
    {
      title: locale === "ar" ? "الأماكن المهمة" : "Important places",
      href: "/locations",
      done: query.data.placesCompleted,
    },
    {
      title: locale === "ar" ? "اهتماماتك" : "Lifestyle interests",
      href: "/interests",
      done: query.data.interestsCompleted,
    },
    {
      title: locale === "ar" ? "التوصيات المناسبة لك" : "Personalized recommendations",
      href: "/dashboard",
      done: false,
      available: query.data.readyForSearch,
    },
  ];
  return (
    <Panel title={copy.profileProgress}>
      <QueryFeedback query={query} />
      <div className="mb-3 flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{copy.summary}</span>
        <span className="font-semibold tabular-nums">
          {new Intl.NumberFormat(locale, {
            style: "percent",
            maximumFractionDigits: 0,
          }).format(query.data.completionPercentage / 100)}
        </span>
      </div>
      <progress
        aria-label={copy.profileProgress}
        value={query.data.completionPercentage}
        max={100}
        className="mb-3 h-1.5 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-secondary [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary"
      />
      <p className="mb-4 text-xs leading-5 text-muted-foreground">
        {query.data.readyForSearch ? copy.completionReady : copy.completionOptional}
      </p>
      <ol className="flex flex-col gap-2">
        {steps.map((step, index) => (
          <li
            key={step.href}
            className="flex min-h-9 items-center gap-3 text-sm"
          >
            <span
              className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-xs tabular-nums"
              aria-hidden="true"
            >
              {new Intl.NumberFormat(locale).format(index + 1)}
            </span>
            <Link
              href={step.href}
              className="text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
            >
              {step.title}
            </Link>
            <span className="ms-auto text-xs text-muted-foreground">
              {step.done
                ? locale === "ar"
                  ? "مكتمل"
                  : "Complete"
                : step.available === false
                  ? locale === "ar"
                    ? "بعد التفضيلات"
                    : "After preferences"
                  : step.available
                    ? locale === "ar"
                      ? "جاهز"
                      : "Ready"
                    : locale === "ar"
                      ? "اختياري"
                      : "Optional"}
            </span>
          </li>
        ))}
      </ol>
      {query.data.missingFeatures
        .filter(
          (item) =>
            !["HOUSING_PREFERENCE", "IMPORTANT_LOCATIONS", "INTERESTS"].includes(
              item.feature,
            ),
        )
        .map((item) => (
          <p
            key={item.feature}
            className="mt-2 text-sm"
          >
            <Link
              href="/profile"
              className="text-primary underline"
            >
              {t.has(item.messageKey.replace(/^profile\./, ""))
                ? t(item.messageKey.replace(/^profile\./, ""))
                : copy.profileTitle}
            </Link>
          </p>
        ))}
    </Panel>
  );
}
