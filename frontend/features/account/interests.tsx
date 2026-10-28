"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, LoaderCircle, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";
import { QueryFeedback } from "@/components/shared/query-feedback";
import { useLifestyleInterests } from "@/features/account/api/query-hooks";
import { invalidateUserData } from "@/features/account/api/invalidation";
import { useIdentity } from "@/features/account/identity";
import { CategorySelector } from "@/features/account/category-selector";
import { lifestyleInterestGroups } from "@/lib/lifestyle-interest-options";
import { saveSelectedInterests } from "@/lib/api/lifestyle-interests";

const supportedCodes = new Set(
  lifestyleInterestGroups.flatMap((group) => group.options.map(([code]) => code)),
);

export function InterestsPage() {
  const t = useTranslations("Workspace");
  const { userId } = useIdentity();
  const cache = useQueryClient();
  const interests = useLifestyleInterests(userId);
  const [draft, setDraft] = useState<string[] | null>(null);

  const activeCodes = useMemo(
    () =>
      (interests.data ?? [])
        .filter((item) => item.active === true)
        .map((item) => item.code),
    [interests.data],
  );
  const selected = draft ?? activeCodes;
  const changed = [...selected].sort().join("\0") !== [...activeCodes].sort().join("\0");
  const hiddenActive = activeCodes.filter((code) => !supportedCodes.has(code));

  const saveMutation = useMutation({
    mutationFn: async (codes: string[]) => {
      await saveSelectedInterests(codes, interests.data ?? []);
      if (userId !== null) await invalidateUserData(cache, userId);
    },
    retry: 0,
    onSuccess: () => setDraft(null),
    onError: async () => {
      if (userId !== null) {
        await cache.invalidateQueries({
          queryKey: ["lifestyle-interests", userId],
        });
      }
    },
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 pb-10">
      <header className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-card p-5 shadow-panel sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-secondary text-primary">
            <Heart
              aria-hidden="true"
              className="size-5"
            />
          </span>
          <div>
            <h1 className="text-page font-semibold tracking-tight">{t("interests")}</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              {t("preferredServicesDescription")}
            </p>
          </div>
        </div>
        {!interests.isPending && !interests.isError ? (
          <p className="text-sm font-medium text-primary">
            {t("activeServiceInterestsCount", { count: selected.length })}
          </p>
        ) : null}
      </header>

      {interests.isPending && !interests.data ? (
        <div className="h-96 animate-pulse rounded-3xl bg-secondary" />
      ) : interests.isError && !interests.data ? (
        <ErrorState
          error={interests.error}
          retry={() => void interests.refetch()}
        />
      ) : (
        <section className="rounded-3xl border border-border/70 bg-card shadow-panel">
          <QueryFeedback query={interests} />
          <div className="border-b border-border/70 p-5 sm:p-6">
            <h2 className="text-lg font-semibold">{t("chooseServiceInterests")}</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {t("serviceInterestsHint")}
            </p>
          </div>
          {hiddenActive.length ? (
            <div className="mx-5 mt-5 rounded-xl border border-border/70 bg-secondary/40 p-4 text-sm text-muted-foreground sm:mx-6">
              {t("unsupportedSavedInterests", { count: hiddenActive.length })}
            </div>
          ) : null}
          <div className="p-5 sm:p-6">
            <CategorySelector
              lifestyle
              value={selected}
              disabled={interests.isFetching || saveMutation.isPending}
              onChange={(codes) => setDraft([...new Set([...codes, ...hiddenActive])])}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 bg-muted/20 p-5 sm:p-6">
            <p className="text-sm text-muted-foreground">
              {t("serviceInterestsPersistHint")}
            </p>
            <Button
              type="button"
              disabled={!changed || interests.isFetching || saveMutation.isPending}
              onClick={() => saveMutation.mutate([...selected])}
            >
              {saveMutation.isPending ? (
                <LoaderCircle
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Save aria-hidden="true" />
              )}
              {saveMutation.isPending ? t("working") : t("saveServiceInterests")}
            </Button>
          </div>
          {saveMutation.isError ? (
            <div className="p-5 pt-0 sm:p-6 sm:pt-0">
              <ErrorState error={saveMutation.error} />
            </div>
          ) : null}
          {saveMutation.isSuccess ? (
            <p
              role="status"
              className="px-5 pb-5 text-sm text-primary sm:px-6"
            >
              {t("savedSuccess")}
            </p>
          ) : null}
        </section>
      )}
    </main>
  );
}
