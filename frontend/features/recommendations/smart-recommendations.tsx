
"use client";

import { getProductCopy } from "@/messages/product-copy";
import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, ArrowUpRight, SlidersHorizontal, CheckCircle2 } from "lucide-react";
import { insights } from "@/lib/api/insights";
import { apiLanguage } from "@/lib/api/config";
import {
  weightsSchema,
  type RecommendationWeights,
} from "@/lib/api/insight-contracts";
import { useHousing } from "@/features/account/api/query-hooks";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { PropertyGridSkeleton } from "@/features/properties/skeletons";
import { PropertyCardView } from "@/features/properties/property-card-view";
import { propertyCardData } from "@/lib/property-card";
import { Badge } from "@/components/ui/badge";
import { propertyHref } from "@/features/properties/format";
import { ErrorState } from "@/components/shared/error-state";
import { useIdentity } from "@/features/account/identity";
import {
  ScoreFacts,
  WeightsControl,
  SafeMarkdown,
} from "@/features/insights/analysis-ui";
import { PropertyActions } from "@/features/properties/property-card";
import { safeUrl } from "@/lib/safe-url";
import { credits } from "@/lib/api/credits";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function SmartRecommendationsPanel({
                                            actionLabel,
                                          }: {
  actionLabel?: string;
} = {}) {
  const { userId } = useIdentity();
  const locale = useLocale();
  const isArabic = locale === "ar";
  const t = useTranslations("Workspace");
  const cache = useQueryClient();
  const text = getProductCopy(locale);
  const preference = useHousing(userId);

  const [weights, setWeights] = useState<RecommendationWeights | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const requestInFlight = useRef(false);

  const prices = useQuery({
    queryKey: ["credit-service-prices", userId],
    queryFn: ({ signal }) => credits.servicePrices(signal),
    enabled: userId !== null,
  });

  const balance = useQuery({
    queryKey: ["credit-balance", userId],
    queryFn: ({ signal }) => credits.balance(signal),
    enabled: userId !== null,
  });

  // Keep the backend's existing credit service key unchanged.
  const cost = prices.data?.TOP_3_RECOMMENDATIONS;

  const request = useMutation({
    mutationFn: (requestWeights?: RecommendationWeights) =>
        insights.smart(apiLanguage(locale), requestWeights),
    retry: 0,
    onSettled: async () => {
      requestInFlight.current = false;
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["credit-balance", userId] }),
        cache.invalidateQueries({ queryKey: ["credit-transactions", userId] }),
      ]);
    },
  });

  const canRequest =
      userId !== null &&
      !!preference.data &&
      cost != null &&
      balance.data != null &&
      balance.data.balance >= cost &&
      !request.isPending &&
      (!weights || weightsSchema.safeParse(weights).success);

  const number = (value: number) =>
      new Intl.NumberFormat(locale).format(value);

  const recommendations = request.data?.recommendations.slice(0, 10) ?? [];

  return (
      <section className="space-y-7">
        {/* Smart search controls */}
        <div className="overflow-hidden rounded-[28px] border border-border/60 bg-card">
          <div className="border-b border-border/50 px-5 py-6 sm:px-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles className="size-5" />
                  <span className="text-xs font-semibold tracking-wide">
                  {isArabic ? "بحث مدعوم بالذكاء الاصطناعي" : "AI-powered search"}
                </span>
                </div>

                <h2 className="font-heading text-section font-semibold">
                  {text.smartTitle}
                </h2>

                <p className="text-sm leading-7 text-muted-foreground">
                  {text.smartHint}
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-border/60 bg-secondary/30 px-4 py-2 text-xs text-muted-foreground">
                <SlidersHorizontal className="size-4" />
                {isArabic ? "نتائج حسب تفضيلاتك" : "Tailored to your preferences"}
              </div>
            </div>
          </div>

          <div className="space-y-5 px-5 py-6 sm:px-7">
            <WeightsControl value={weights} onChange={setWeights} />

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/50 pt-5">
              <div className="space-y-1">
                {cost != null ? (
                    <p className="text-sm text-muted-foreground">
                      {t("smartRecommendationsCost", {
                        cost: number(cost),
                        balance: number(balance.data?.balance ?? 0),
                      })}
                    </p>
                ) : null}

                {balance.data &&
                cost != null &&
                balance.data.balance < cost ? (
                    <p className="text-sm text-destructive">
                      {t("recommendationInsufficientCredits")}{" "}
                      <Link href="/payments" className="underline">
                        {t("payments")}
                      </Link>
                    </p>
                ) : null}
              </div>

              <Button
                  size="lg"
                  className="min-w-44 rounded-xl"
                  disabled={
                      !preference.data ||
                      prices.isPending ||
                      balance.isPending ||
                      prices.isError ||
                      balance.isError ||
                      request.isPending ||
                      cost == null ||
                      (balance.data != null && cost > balance.data.balance) ||
                      (!!weights && !weightsSchema.safeParse(weights).success)
                  }
                  onClick={() => setConfirmOpen(true)}
              >
                <Sparkles className="size-4" />
                {request.isPending
                    ? text.smartBusy
                    : actionLabel ?? text.smartAction}
              </Button>
            </div>

            {prices.isError || balance.isError ? (
                <ErrorState error={prices.error ?? balance.error} />
            ) : null}
          </div>
        </div>

        {/* Recommendation results */}
        {request.isPending ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="size-4" />
                {isArabic
                    ? "نحلل العقارات ونرتب الأنسب لك..."
                    : "Analyzing and ranking your matches..."}
              </div>
              <PropertyGridSkeleton
                  count={2}
                  className="lg:grid-cols-2"
              />
            </div>
        ) : request.isError ? (
            <ErrorState error={request.error} />
        ) : request.data ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-5">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <CheckCircle2 className="size-4" />
                    <span className="text-xs font-medium">
                  {isArabic ? "اكتمل التحليل" : "Analysis complete"}
                </span>
                  </div>

                  <h3 className="font-heading text-xl font-semibold sm:text-2xl">
                    {isArabic ? "العقارات الأنسب لك" : "Your best property matches"}
                  </h3>

                  <p className="text-sm leading-6 text-muted-foreground">
                    {isArabic
                        ? "رتبنا النتائج بناءً على تفضيلاتك، مع توضيح أسباب ترشيح كل عقار."
                        : "Ranked by your preferences, with an explanation for every match."}
                  </p>
                </div>

                <span className="rounded-full border border-border/60 bg-card px-4 py-2 text-xs font-medium">
              {number(recommendations.length)}{" "}
                  {isArabic ? "عقارات مرشحة" : "recommended properties"}
            </span>
              </div>

              {recommendations.length === 0 ? (
                  <div className="rounded-2xl border border-border/60 bg-card p-8 text-center text-muted-foreground">
                    {text.noCandidates}
                  </div>
              ) : (
                  <div className="grid items-start gap-6 lg:grid-cols-2">
                    {recommendations.map((item) => {
                      const detailHref = propertyHref({
                        source: item.source,
                        externalId: item.propertyId,
                      });
                      const originalUrl = safeUrl(item.listingUrl);

                      return (
                          <div
                              key={`${item.source}:${item.propertyId}`}
                              className="min-w-0 overflow-hidden rounded-[26px] border border-border/60 bg-card shadow-sm transition-shadow duration-300 hover:shadow-md"
                          >
                            <PropertyCardView
                                listing={propertyCardData(
                                    {
                                      title: item.title,
                                      image: item.image,
                                      price: item.price,
                                      city: item.city,
                                      neighborhood: item.neighborhood,
                                      bedrooms: item.bedrooms,
                                      areaSqm: item.areaSqm,
                                    },
                                    text.untitled,
                                )}
                                href={detailHref}
                                badge={
                                  <Badge
                                      variant="secondary"
                                      className="rounded-full px-3 py-1"
                                  >
                                    {isArabic ? "المرتبة" : "Rank"}{" "}
                                    {number(item.rank)}
                                  </Badge>
                                }
                                metadata={
                                  <div className="space-y-5">
                                    <div className="rounded-2xl border border-border/50 bg-secondary/20 p-4">
                                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                          <Sparkles className="size-4 text-primary" />
                                          <span className="text-sm font-semibold">
                                  {isArabic
                                      ? "تحليل مدى الملاءمة"
                                      : "Suitability analysis"}
                                </span>
                                        </div>
                                      </div>

                                      <ScoreFacts
                                          match={item.matchScore}
                                          housing={item.housingScore}
                                          commute={item.commuteScore}
                                          services={item.servicesScore}
                                      />
                                    </div>

                                    <div className="space-y-3">
                                      <div className="flex items-center gap-2">
                                        <Sparkles className="size-4 text-primary" />
                                        <h4 className="text-sm font-semibold">
                                          {isArabic
                                              ? "ليش رشحنا لك هذا العقار؟"
                                              : "Why this property?"}
                                        </h4>
                                      </div>

                                      <div className="rounded-2xl border border-border/50 bg-card px-4 py-3 text-sm leading-7">
                                        <SafeMarkdown text={item.aiReason} />
                                      </div>
                                    </div>

                                    {item.aiTradeOff ? (
                                        <details className="group rounded-2xl border border-border/60 bg-secondary/20 px-4 py-3">
                                          <summary className="cursor-pointer text-sm font-medium text-primary">
                                            {isArabic
                                                ? "وش الأشياء اللي تحتاج تنتبه لها؟"
                                                : "What should you consider?"}
                                          </summary>

                                          <div className="mt-3 border-t border-border/50 pt-3 text-sm leading-7 text-muted-foreground">
                                            <SafeMarkdown text={item.aiTradeOff} />
                                          </div>
                                        </details>
                                    ) : null}
                                  </div>
                                }
                                footer={
                                  <div className="w-full space-y-3">
                                    <PropertyActions
                                        property={{
                                          source: item.source,
                                          externalId: item.propertyId,
                                        }}
                                        compact
                                    />

                                    <div className="flex flex-wrap gap-2">
                                      <Button
                                          className="min-w-0 flex-1 rounded-xl"
                                          nativeButton={false}
                                          render={<Link href={detailHref} />}
                                      >
                                        {text.propertyDetails}
                                      </Button>

                                      {originalUrl ? (
                                          <Button
                                              variant="outline"
                                              className="rounded-xl"
                                              nativeButton={false}
                                              render={
                                                <a
                                                    href={originalUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                />
                                              }
                                          >
                                            {isArabic ? "الإعلان الأصلي" : "Original listing"}
                                            <ArrowUpRight className="size-4" />
                                          </Button>
                                      ) : null}
                                    </div>
                                  </div>
                                }
                            />
                          </div>
                      );
                    })}
                  </div>
              )}
            </div>
        ) : null}

        {/* Keep credit confirmation unchanged */}

        <AlertDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("confirmSmartRecommendationsTitle")}
              </AlertDialogTitle>

              <AlertDialogDescription>
                {t("confirmSmartRecommendationsDescription", {
                  cost: number(cost ?? 0),
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel>
                {t("cancel")}
              </AlertDialogCancel>

              <AlertDialogAction
                  disabled={!canRequest}
                  onClick={(event) => {
                    event.preventDefault();

                    if (!canRequest || requestInFlight.current) return;

                    requestInFlight.current = true;

                    // Close immediately, without waiting for the API response.
                    setConfirmOpen(false);

                    // Start the request once.
                    request.mutate(weights ?? undefined);
                  }}
              >
                {t("confirmAndContinue")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </section>
  );
}
