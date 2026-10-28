"use client";
import { getProductCopy } from "@/messages/product-copy";
import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insights } from "@/lib/api/insights";
import { apiLanguage } from "@/lib/api/config";
import { weightsSchema, type RecommendationWeights } from "@/lib/api/insight-contracts";
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
}: { actionLabel?: string } = {}) {
  const { userId } = useIdentity();
  const locale = useLocale();
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
  const cost = prices.data?.TOP_3_RECOMMENDATIONS;
  const request = useMutation({
    mutationFn: (requestWeights?: RecommendationWeights) =>
      insights.smart(apiLanguage(locale), requestWeights),
    retry: 0,
    onSuccess: () => setConfirmOpen(false),
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
  const number = (value: number) => new Intl.NumberFormat(locale).format(value);
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-section font-medium">{text.smartTitle}</h2>
      <p className="text-xs leading-6 text-muted-foreground">{text.smartHint}</p>
      <Button
        className="self-start"
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
        {request.isPending ? text.smartBusy : (actionLabel ?? text.smartAction)}
      </Button>
      {cost != null ? (
        <p className="text-xs text-muted-foreground">
          {t("smartRecommendationsCost", {
            cost: number(cost),
            balance: number(balance.data?.balance ?? 0),
          })}
        </p>
      ) : null}
      {balance.data && cost != null && balance.data.balance < cost ? (
        <p className="text-sm text-destructive">
          {t("recommendationInsufficientCredits")}{" "}
          <Link
            href="/payments"
            className="underline"
          >
            {t("payments")}
          </Link>
        </p>
      ) : null}
      {prices.isError || balance.isError ? (
        <ErrorState error={prices.error ?? balance.error} />
      ) : null}
      <WeightsControl
        value={weights}
        onChange={setWeights}
      />
      {request.isPending ? (
        <PropertyGridSkeleton
          count={2}
          className="lg:grid-cols-2"
        />
      ) : request.isError ? (
        <ErrorState error={request.error} />
      ) : request.data ? (
        <>
          {!request.data.recommendations.length ? (
            <p>{text.noCandidates}</p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {request.data.recommendations.slice(0, 10).map((item) => (
                <PropertyCardView
                  key={`${item.source}:${item.propertyId}`}
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
                  href={propertyHref({
                    source: item.source,
                    externalId: item.propertyId,
                  })}
                  badge={
                    <Badge variant="secondary">
                      {locale === "ar" ? "الترتيب" : "Rank"}{" "}
                      {new Intl.NumberFormat(locale).format(item.rank)}
                    </Badge>
                  }
                  metadata={
                    <>
                      <ScoreFacts
                        match={item.matchScore}
                        housing={item.housingScore}
                        commute={item.commuteScore}
                        services={item.servicesScore}
                      />
                      <SafeMarkdown text={item.aiReason} />
                      {item.aiTradeOff ? (
                        <details>
                          <summary className="cursor-pointer py-2 text-caption text-primary">
                            {locale === "ar"
                              ? "ما الذي ينبغي مراعاته؟"
                              : "What should I consider?"}
                          </summary>
                          <SafeMarkdown text={item.aiTradeOff} />
                        </details>
                      ) : null}
                    </>
                  }
                  footer={
                    <div className="flex w-full flex-col gap-2">
                      <PropertyActions
                        property={{ source: item.source, externalId: item.propertyId }}
                        compact
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          nativeButton={false}
                          render={
                            <Link
                              href={propertyHref({
                                source: item.source,
                                externalId: item.propertyId,
                              })}
                            />
                          }
                        >
                          {text.propertyDetails}
                        </Button>
                        {safeUrl(item.listingUrl) ? (
                          <Button
                            variant="ghost"
                            nativeButton={false}
                            render={
                              <a
                                href={safeUrl(item.listingUrl)!}
                                target="_blank"
                                rel="noopener noreferrer"
                              />
                            }
                          >
                            {locale === "ar" ? "الإعلان الأصلي" : "Original listing"}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </>
      ) : null}
      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => !request.isPending && setConfirmOpen(open)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmSmartRecommendationsTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmSmartRecommendationsDescription", {
                cost: number(cost ?? 0),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={request.isPending}>
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={!canRequest}
              onClick={(event) => {
                event.preventDefault();
                if (!canRequest || requestInFlight.current) return;
                requestInFlight.current = true;
                request.mutate(weights ?? undefined);
              }}
            >
              {request.isPending ? t("working") : t("confirmAndContinue")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
