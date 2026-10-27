"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { insights } from "@/lib/api/insights";
import { Button } from "@/components/ui/button";
import { SummarySkeleton } from "@/components/shared/page-skeleton";
import { QueryFeedback } from "@/components/shared/query-feedback";
import { ErrorState } from "@/components/shared/error-state";
import { Panel } from "@/components/shared/panel";
import { useIdentity } from "@/features/account/identity";
import { SafeMarkdown } from "@/features/insights/analysis-ui";
import { GoogleDataAttribution } from "@/components/maps/google-data-attribution";

// Reuse the floating assistant instead of keeping a second conversation/memory UI.
export function AiAssistantPanel() {
  const { userId } = useIdentity();
  const ar = useLocale() === "ar";
  const t = useTranslations("AiExplanation");
  const [explain, setExplain] = useState(false);
  const explanation = useQuery({
    queryKey: ["ai-explanation", userId],
    queryFn: ({ signal }) => insights.explanation(signal),
    enabled: explain,
    retry: false,
  });
  return (
    <Panel title={ar ? "مساعد مدار" : "MADAR Assistant"}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => window.dispatchEvent(new Event("madar-assistant-open"))}>
            {ar ? "فتح المحادثة" : "Open conversation"}
          </Button>
          <Button
            variant="outline"
            disabled={explanation.isFetching}
            onClick={() => {
              if (explain) void explanation.refetch();
              else setExplain(true);
            }}
          >
            {ar ? "شرح وضعي في السوق" : "Explain my market position"}
          </Button>
        </div>
        {explain ? (
          <>
            <QueryFeedback query={explanation} />
            {explanation.isPending ? (
              <SummarySkeleton />
            ) : explanation.isError && !explanation.data ? (
              <ErrorState
                error={explanation.error}
                retry={() => void explanation.refetch()}
              />
            ) : explanation.data ? (
              <div className="flex flex-col gap-3 rounded-2xl bg-secondary/40 p-4">
                <h3 className="font-semibold">{explanation.data.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {explanation.data.generatedByAi ? t("generated") : t("direct")}
                </p>
                <SafeMarkdown text={explanation.data.summary} />
                <SafeMarkdown text={explanation.data.budgetPosition} />
                <ul className="list-inside list-disc text-sm">
                  {explanation.data.highlights?.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
                <SafeMarkdown text={explanation.data.advice} />
                <p className="text-xs text-muted-foreground">
                  {t("budget")}: {explanation.data.matchSummary.budget} {t("currency")} ·{" "}
                  {t("sample")}: {explanation.data.matchSummary.totalListings} ·{" "}
                  {t("minimumPrice")}:{" "}
                  {explanation.data.marketStats.minPrice ?? t("unavailable")}{" "}
                  {explanation.data.marketStats.minPrice == null ? "" : t("currency")}
                </p>
              </div>
            ) : null}
          </>
        ) : null}
        {explain && explanation.data ? <GoogleDataAttribution /> : null}
      </div>
    </Panel>
  );
}
