"use client";
import { QueryFeedback } from "@/components/shared/query-feedback";
import { FormPanelSkeleton } from "@/components/shared/page-skeleton";
import {
  ComparisonListSkeleton,
  ComparisonSkeleton,
} from "@/features/comparisons/skeletons";

import { ComparisonWorkspace } from "./comparison-workspace";
import { useState } from "react";
import { TaskDialog } from "@/components/shared/task-dialog";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { z } from "zod";
import { Link } from "@/i18n/navigation";
import { useComparisons, useSaved, keys } from "@/features/account/api/query-hooks";
import { comparisonsApi } from "@/lib/api/comparisons";
import type { PropertyComparison, SavedProperty } from "@/lib/api/contracts";
import { useIdentity } from "@/features/account/identity";
import { DataForm } from "@/components/forms/data-form";
import { DeleteAction } from "@/components/shared/delete-action";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

const pairSchema = z
  .object({ first: z.string().min(1), second: z.string().min(1) })
  .refine((v) => v.first !== v.second, { path: ["second"] });
const referenceValue = (source: string, id: string) => JSON.stringify([source, id]);
function PairForm({
  pair,
  onSaved,
  onBusy,
}: {
  pair?: PropertyComparison;
  onSaved?: () => void;
  onBusy?: (busy: boolean) => void;
}) {
  const t = useTranslations("Workspace");
  const { userId } = useIdentity();
  const saved = useSaved(userId);
  const cache = useQueryClient();
  const params = useSearchParams();
  if (saved.isPending) return <FormPanelSkeleton fields={2} />;
  if (saved.isError)
    return (
      <ErrorState
        error={saved.error}
        retry={() => void saved.refetch()}
      />
    );
  const options = saved.data.map((p) => ({
    value: referenceValue(p.source, p.externalPropertyId),
    label: `${p.titleSnapshot || p.externalPropertyId} · ${p.source}`,
  }));
  if (pair)
    for (const [source, id] of [
      [pair.firstPropertySource, pair.firstPropertyId],
      [pair.secondPropertySource, pair.secondPropertyId],
    ]) {
      const value = referenceValue(source, id);
      if (!options.some((o) => o.value === value))
        options.push({ value, label: `${id} · ${source}` });
    }
  const initial = saved.data.find((p) => String(p.id) === params.get("first"));
  const initialSecond = saved.data.find((p) => String(p.id) === params.get("second"));
  if (options.length < 2)
    return (
      <EmptyState
        title={t("needTwoProperties")}
        description={t("needTwoPropertiesHint")}
      >
        <Button
          nativeButton={false}
          render={<Link href="/saved" />}
        >
          {t("addProperty")}
        </Button>
      </EmptyState>
    );
  return (
    <DataForm
      schema={pairSchema}
      defaults={{
        first: pair
          ? referenceValue(pair.firstPropertySource, pair.firstPropertyId)
          : initial
            ? referenceValue(initial.source, initial.externalPropertyId)
            : options[0].value,
        second: pair
          ? referenceValue(pair.secondPropertySource, pair.secondPropertyId)
          : initialSecond
            ? referenceValue(initialSecond.source, initialSecond.externalPropertyId)
            : "",
      }}
      fields={[
        { name: "first", options, control: "search", fullWidth: true },
        {
          name: "second",
          control: "search",
          fullWidth: true,
          options: [{ value: "", label: t("chooseProperty") }, ...options],
        },
      ]}
      onSubmit={async (value) => {
        onBusy?.(true);
        try {
          const [firstPropertySource, firstPropertyId] = JSON.parse(value.first) as [
            string,
            string,
          ];
          const [secondPropertySource, secondPropertyId] = JSON.parse(value.second) as [
            string,
            string,
          ];
          const body = {
            firstPropertySource,
            firstPropertyId,
            secondPropertySource,
            secondPropertyId,
          };
          if (pair?.id) await comparisonsApi.update(pair.id, body);
          else await comparisonsApi.add(body);
          await cache.invalidateQueries({ queryKey: keys.comparisons(userId) });
          if (pair?.id)
            await cache.invalidateQueries({ queryKey: ["comparison", userId, pair.id] });
          onSaved?.();
        } finally {
          onBusy?.(false);
        }
      }}
    />
  );
}
function PairSummary({
  pair,
  saved,
}: {
  pair: PropertyComparison;
  saved: SavedProperty[];
}) {
  const t = useTranslations("Workspace");
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {[
        [pair.firstPropertySource, pair.firstPropertyId],
        [pair.secondPropertySource, pair.secondPropertyId],
      ].map(([source, id], index) => (
        <div
          key={`${source}:${id}`}
          className="min-w-0 rounded-xl bg-secondary/40 p-4"
        >
          <p className="text-xs text-muted-foreground">
            {t(index === 0 ? "fields.first" : "fields.second")}
          </p>
          <p className="mt-2 text-sm font-medium wrap-break-word">
            <bdi>
              {saved.find(
                (property) =>
                  property.source === source && property.externalPropertyId === id,
              )?.titleSnapshot || id}
            </bdi>
          </p>
        </div>
      ))}
    </div>
  );
}
export function ComparisonsPage() {
  const t = useTranslations("Workspace");
  const { userId } = useIdentity();
  const query = useComparisons(userId);
  const saved = useSaved(userId);
  const cache = useQueryClient();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex min-w-0 flex-col gap-8 pb-10">
      <ComparisonWorkspace />
      <section className="flex min-w-0 flex-col gap-4">
        <PageHeading
          title={t("savedComparisonsTitle")}
          description={t("savedComparisonsDescription")}
        >
          <Button onClick={() => setOpen(true)}>{t("createComparison")}</Button>
        </PageHeading>
        <QueryFeedback query={query} />
        <QueryFeedback query={saved} />
        {saved.isError && !saved.data ? (
          <div className="mb-4">
            <ErrorState
              error={saved.error}
              retry={() => void saved.refetch()}
            />
          </div>
        ) : null}
        {query.isPending ? (
          <ComparisonListSkeleton />
        ) : query.isError && !query.data?.length ? (
          <ErrorState
            error={query.error}
            retry={() => void query.refetch()}
          />
        ) : !query.data.length ? (
          <EmptyState
            title={t("noComparisons")}
            description={t("noComparisonsHint")}
          >
            <Button onClick={() => setOpen(true)}>{t("createComparison")}</Button>
          </EmptyState>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {query.data.map((pair) => (
              <Card
                key={pair.id}
                className="gap-4 rounded-2xl border-border/60 shadow-none"
              >
                <CardHeader>
                  <CardTitle>
                    <h2>{t("comparisonPair")}</h2>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {saved.isPending ? (
                    <ComparisonListSkeleton />
                  ) : (
                    <PairSummary
                      pair={pair}
                      saved={saved.data || []}
                    />
                  )}
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    nativeButton={false}
                    render={<Link href={`/compare/${pair.id}`} />}
                  >
                    {t("viewEdit")}
                  </Button>
                  <DeleteAction
                    onDelete={async () => {
                      await comparisonsApi.remove(pair.id!);
                      await cache.invalidateQueries({
                        queryKey: keys.comparisons(userId),
                      });
                    }}
                  />
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
        <TaskDialog
          open={open}
          onOpenChange={setOpen}
          busy={busy}
          title={t("createComparison")}
        >
          <PairForm
            key={`${params.get("first") || "new"}:${params.get("second") || "new"}`}
            onBusy={setBusy}
            onSaved={() => setOpen(false)}
          />
        </TaskDialog>
      </section>
    </div>
  );
}
export function ComparisonDetail({ id }: { id: number }) {
  const { userId } = useIdentity();
  const query = useQuery({
    queryKey: ["comparison", userId, id],
    queryFn: ({ signal }) => comparisonsApi.detail(id, signal),
  });
  if (query.isPending) return <ComparisonSkeleton detail />;
  if (query.isError && !query.data)
    return (
      <ErrorState
        error={query.error}
        retry={() => void query.refetch()}
      />
    );
  return <ComparisonWorkspace initialPair={query.data} />;
}
