"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { Check, SlidersHorizontal, Sparkles } from "lucide-react";
import { useIdentity } from "@/features/account/identity";
import {
  keys,
  useHousing,
  useLifestyleInterests,
  usePlaces,
  useProfileCompletion,
} from "@/features/account/api/query-hooks";
import { CategorySelector } from "@/features/account/category-selector";
import { SmartRecommendationsPanel } from "@/features/recommendations/smart-recommendations";
import { NeighborhoodSuggestionsPanel } from "@/features/recommendations/neighborhood-suggestions";
import { TaskDialog } from "@/components/shared/task-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { preferencesApi } from "@/lib/api/preferences";
import { placesApi } from "@/lib/api/places";
import { saveSelectedInterests } from "@/lib/api/lifestyle-interests";
import type { PlacePreference } from "@/lib/api/contracts";
import { SearchHousingForm, SearchPlaceForm } from "./smart-search-forms";
import { hasUsableCommuteWeights, smartSearchReady } from "./smart-search-state";

type DialogView = "requirements" | "housing" | "places" | "interests";

export function SmartSearchWorkspace() {
  const t = useTranslations("PropertyDiscovery");
  const locale = useLocale();
  const { userId } = useIdentity();
  const cache = useQueryClient();
  const completion = useProfileCompletion(userId);
  const housing = useHousing(userId);
  const places = usePlaces(userId);
  const interests = useLifestyleInterests(userId);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<DialogView>("requirements");
  const [editingPlace, setEditingPlace] = useState<PlacePreference | null>(null);
  const [busy, setBusy] = useState(false);
  const [recommendationRevision, setRecommendationRevision] = useState(0);
  const shownMissing = useRef(false);
  const needsPlaceCorrection =
    !!places.data?.length && !hasUsableCommuteWeights(places.data);

  useEffect(() => {
    if (
      completion.data &&
      (!completion.data.readyForSearch || needsPlaceCorrection) &&
      !shownMissing.current
    ) {
      shownMissing.current = true;
      setOpen(true);
    }
  }, [completion.data, needsPlaceCorrection]);

  const refresh = async (kind: "housing" | "places" | "interests") => {
    const resourceKey =
      kind === "housing"
        ? keys.housing(userId)
        : kind === "places"
          ? keys.places(userId)
          : keys.interests(userId);
    await Promise.all([
      cache.invalidateQueries({ queryKey: resourceKey, refetchType: "none" }),
      cache.invalidateQueries({
        queryKey: ["profile-completion", userId],
        refetchType: "none",
      }),
      cache.invalidateQueries({ queryKey: ["smart", userId], refetchType: "none" }),
    ]);
    const resource =
      kind === "housing"
        ? await housing.refetch()
        : kind === "places"
          ? await places.refetch()
          : await interests.refetch();
    const status = await completion.refetch();
    if (resource.isError || status.isError) throw resource.error ?? status.error;
    if (kind === "housing" && (!status.data?.readyForSearch || !resource.data)) {
      throw new Error(t("saveNotConfirmed"));
    }
    setRecommendationRevision((previous) => previous + 1);
  };

  const saveHousing: React.ComponentProps<typeof SearchHousingForm>["onSave"] = async (
    value,
  ) => {
    if (busy) return;
    setBusy(true);
    try {
      if (housing.data?.id) await preferencesApi.update(housing.data.id, value);
      else await preferencesApi.add(value);
      await refresh("housing");
      setView("requirements");
    } finally {
      setBusy(false);
    }
  };

  const savePlace: React.ComponentProps<typeof SearchPlaceForm>["onSave"] = async (
    value,
  ) => {
    if (busy) return;
    setBusy(true);
    try {
      if (editingPlace?.id) await placesApi.update(editingPlace.id, value);
      else await placesApi.add(value);
      await refresh("places");
      setEditingPlace(null);
      setView("requirements");
    } finally {
      setBusy(false);
    }
  };

  const showView = (next: DialogView) => {
    setView(next);
    setOpen(true);
  };

  if (
    completion.isPending ||
    housing.isPending ||
    (completion.data?.placesCompleted && places.isPending)
  ) {
    return (
      <div
        role="status"
        aria-label={t("loadingProfile")}
        className="space-y-3"
      >
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
    );
  }
  if (
    completion.isError ||
    housing.isError ||
    (completion.data?.placesCompleted && places.isError)
  ) {
    return (
      <ErrorState
        error={completion.error ?? housing.error ?? places.error}
        retry={() =>
          void Promise.all([completion.refetch(), housing.refetch(), places.refetch()])
        }
      />
    );
  }

  const ready = smartSearchReady(completion.data, housing.data) && !needsPlaceCorrection;
  const dialogTitle =
    view === "housing"
      ? t("housingRequirement")
      : view === "places"
        ? t("placesRequirement")
        : view === "interests"
          ? t("interestsRequirement")
          : t("completeTitle");

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-border/60 bg-card p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-heading text-section font-semibold">{t("smartTitle")}</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              {ready ? t("readyDescription") : t("completeDescription")}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => showView("requirements")}
          >
            <SlidersHorizontal data-icon="inline-start" />
            {t("editInformation")}
          </Button>
        </div>
        {housing.data ? (
          <p className="mt-5 text-sm text-muted-foreground">
            {t("savedPreferences")}: <bdi>{housing.data.city}</bdi> ·{" "}
            {new Intl.NumberFormat(locale, {
              style: "currency",
              currency: "SAR",
              maximumFractionDigits: 0,
            }).format(housing.data.maxBudget)}
          </p>
        ) : null}
      </div>

      {ready ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">{t("creditNotice")}</p>
          <SmartRecommendationsPanel
            key={recommendationRevision}
            actionLabel={t("smartStart")}
          />
          <NeighborhoodSuggestionsPanel />
          <p className="text-xs text-muted-foreground">{t("aiNotice")}</p>
        </div>
      ) : (
        <Button onClick={() => showView("requirements")}>
          <Sparkles data-icon="inline-start" />
          {t("completeAction")}
        </Button>
      )}

      <TaskDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setView("requirements");
        }}
        busy={busy}
        title={dialogTitle}
        description={
          view === "requirements" ? t("completeDescription") : t("formDescription")
        }
      >
        {view !== "requirements" ? (
          <Button
            variant="ghost"
            className="self-start"
            disabled={busy}
            onClick={() => setView("requirements")}
          >
            {t("backToRequirements")}
          </Button>
        ) : null}
        {view === "requirements" ? (
          <div className="space-y-3">
            <RequirementButton
              title={t("housingRequirement")}
              status={completion.data?.housingCompleted ? t("completed") : t("required")}
              complete={!!completion.data?.housingCompleted}
              onClick={() => setView("housing")}
            />
            <RequirementButton
              title={t("placesRequirement")}
              status={
                needsPlaceCorrection
                  ? t("needsVisitFrequency")
                  : completion.data?.placesCompleted
                    ? t("completed")
                    : t("optional")
              }
              complete={!!completion.data?.placesCompleted && !needsPlaceCorrection}
              onClick={() => setView("places")}
            />
            <RequirementButton
              title={t("interestsRequirement")}
              status={
                completion.data?.interestsCompleted ? t("completed") : t("optional")
              }
              complete={!!completion.data?.interestsCompleted}
              onClick={() => setView("interests")}
            />
            {ready ? (
              <p
                role="status"
                className="text-sm text-primary"
              >
                {t("readyNow")}
              </p>
            ) : null}
          </div>
        ) : null}
        {view === "housing" ? (
          <SearchHousingForm
            existing={housing.data ?? null}
            onSave={saveHousing}
            onCancel={() => setView("requirements")}
          />
        ) : null}
        {view === "places" ? (
          places.isPending ? (
            <Skeleton className="h-36 w-full" />
          ) : places.isError ? (
            <ErrorState
              error={places.error}
              retry={() => void places.refetch()}
            />
          ) : (
            <div className="space-y-4">
              {(places.data ?? []).map((place) => (
                <div
                  key={place.id}
                  className="flex items-center justify-between gap-3 rounded-xl border p-3"
                >
                  <span className="min-w-0 truncate text-sm">{place.name}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingPlace(place)}
                  >
                    {t("edit")}
                  </Button>
                </div>
              ))}
              {editingPlace ? (
                <Button
                  variant="ghost"
                  onClick={() => setEditingPlace(null)}
                >
                  {t("addAnotherPlace")}
                </Button>
              ) : null}
              <SearchPlaceForm
                existing={editingPlace}
                onSave={savePlace}
                onCancel={() => setView("requirements")}
              />
            </div>
          )
        ) : null}
        {view === "interests" ? (
          interests.isPending ? (
            <Skeleton className="h-36 w-full" />
          ) : interests.isError ? (
            <ErrorState
              error={interests.error}
              retry={() => void interests.refetch()}
            />
          ) : (
            <InterestSelection
              key={interests.data?.map((item) => `${item.id}:${item.active}`).join(",")}
              initial={
                interests.data?.filter((item) => item.active).map((item) => item.code) ??
                []
              }
              onSave={async (selected) => {
                if (busy) return;
                setBusy(true);
                try {
                  await saveSelectedInterests(selected);
                  await refresh("interests");
                  setView("requirements");
                } finally {
                  setBusy(false);
                }
              }}
              onCancel={() => setView("requirements")}
              busy={busy}
            />
          )
        ) : null}
      </TaskDialog>
    </section>
  );
}

function RequirementButton({
  title,
  status,
  complete,
  onClick,
}: {
  title: string;
  status: string;
  complete: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border/60 p-4 text-start transition-colors hover:bg-secondary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <span className="font-medium">{title}</span>
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        {complete ? (
          <Check
            aria-hidden="true"
            className="size-4 text-primary"
          />
        ) : null}
        {status}
      </span>
    </button>
  );
}

function InterestSelection({
  initial,
  onSave,
  onCancel,
  busy,
}: {
  initial: string[];
  onSave: (selected: string[]) => Promise<void>;
  onCancel: () => void;
  busy: boolean;
}) {
  const t = useTranslations("PropertyDiscovery");
  const [selected, setSelected] = useState(initial);
  const [error, setError] = useState<unknown>(null);
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!busy) void onSave(selected).catch(setError);
      }}
    >
      <p className="text-sm text-muted-foreground">{t("interestsOptional")}</p>
      <CategorySelector
        lifestyle
        value={selected}
        onChange={setSelected}
        disabled={busy}
      />
      {error ? <ErrorState error={error} /> : null}
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={busy}
        >
          {busy ? t("saving") : t("save")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={busy}
        >
          {t("backToRequirements")}
        </Button>
      </div>
    </form>
  );
}
