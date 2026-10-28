"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ClipboardCheck, LoaderCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { DeleteAction } from "@/components/shared/delete-action";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { useIdentity } from "@/features/account/identity";
import { useMovingChecklist } from "@/features/account/api/query-hooks";
import { movingChecklistApi, type MovingTask } from "@/lib/api/moving-checklist";
import { ApiError } from "@/lib/api/errors";

function isMissingChecklist(error: unknown) {
  return (
    error instanceof ApiError &&
    error.backendMessage === "Moving checklist not found, generate it first"
  );
}

function TaskList({
  title,
  tasks,
  onToggle,
  pending,
}: {
  title: string;
  tasks: MovingTask[];
  onToggle: (id: number) => void;
  pending: boolean;
}) {
  const t = useTranslations("Workspace");
  if (!tasks.length) return null;
  return (
    <section className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5">
      <h2 className="font-semibold">{title}</h2>
      <ul className="mt-3 divide-y divide-border/60">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="flex items-start gap-3 py-3"
          >
            <input
              type="checkbox"
              checked={task.done}
              disabled={pending}
              onChange={() => onToggle(task.id)}
              aria-label={t("toggleMovingTask", { title: task.title })}
              className="mt-1 size-4 shrink-0 accent-primary"
            />
            <span
              className={
                task.done ? "text-sm text-muted-foreground line-through" : "text-sm"
              }
            >
              {task.title}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function MovingChecklistPage() {
  const locale = useLocale();
  const t = useTranslations("Workspace");
  const { userId } = useIdentity();
  const cache = useQueryClient();
  const language = locale === "en" ? "en" : "ar";
  const query = useMovingChecklist(userId, language);
  const invalidate = () =>
    cache.invalidateQueries({
      queryKey: ["moving-checklist", userId],
      refetchType: "none",
    });
  const generate = useMutation({
    mutationFn: movingChecklistApi.generate,
    retry: 0,
    onSuccess: async () => {
      await invalidate();
      await query.refetch();
    },
  });
  const toggle = useMutation({
    mutationFn: movingChecklistApi.toggle,
    retry: 0,
    onSuccess: invalidate,
  });
  const reset = useMutation({
    mutationFn: movingChecklistApi.reset,
    retry: 0,
    onSuccess: async () => {
      await cache.resetQueries({ queryKey: ["moving-checklist", userId] });
    },
  });
  const data = query.data;
  const percentage = data?.total ? Math.round((data.done / data.total) * 100) : 0;
  const busy = generate.isPending || toggle.isPending || reset.isPending;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-5 pb-10">
      <PageHeading
        title={t("movingChecklist")}
        description={t("movingChecklistDescription")}
      />
      {query.isPending && !data ? (
        <div
          role="status"
          className="space-y-3"
        >
          <div className="h-28 animate-pulse rounded-2xl bg-secondary" />
          <div className="h-56 animate-pulse rounded-2xl bg-secondary" />
        </div>
      ) : query.isError && !isMissingChecklist(query.error) && !data ? (
        <ErrorState
          error={query.error}
          retry={() => void query.refetch()}
        />
      ) : isMissingChecklist(query.error) || !data ? (
        <section className="rounded-3xl border border-dashed border-border bg-card p-6 text-center shadow-panel sm:p-10">
          <ClipboardCheck
            className="mx-auto size-10 text-primary"
            aria-hidden="true"
          />
          <h2 className="mt-4 text-lg font-semibold">{t("movingChecklistEmptyTitle")}</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            {t("movingChecklistEmptyDescription")}
          </p>
          <Button
            className="mt-5"
            disabled={busy}
            onClick={() => generate.mutate()}
          >
            {generate.isPending ? (
              <LoaderCircle
                className="size-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <CheckCircle2 aria-hidden="true" />
            )}
            {generate.isPending ? t("working") : t("generateMovingChecklist")}
          </Button>
          {generate.isError ? (
            <div className="mx-auto mt-4 max-w-xl text-start">
              <ErrorState error={generate.error} />
            </div>
          ) : null}
        </section>
      ) : (
        <>
          <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-panel sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">
                  {t("movingChecklistProgress", { done: data.done, total: data.total })}
                </p>
                <div
                  role="progressbar"
                  aria-label={t("movingChecklistProgressLabel")}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={percentage}
                  className="mt-3 h-2 w-56 max-w-full overflow-hidden rounded-full bg-secondary"
                >
                  <div
                    className="h-full rounded-full bg-primary transition-[width]"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
              <DeleteAction
                label={t("resetMovingChecklist")}
                title={t("resetMovingChecklistTitle")}
                description={t("resetMovingChecklistDescription")}
                confirmLabel={t("resetMovingChecklist")}
                onDelete={() => reset.mutateAsync()}
              />
            </div>
            {reset.isError ? (
              <div className="mt-3">
                <ErrorState error={reset.error} />
              </div>
            ) : null}
            {toggle.isError ? (
              <div className="mt-3">
                <ErrorState error={toggle.error} />
              </div>
            ) : null}
          </section>
          {data.note ? (
            <p className="rounded-xl bg-secondary/50 p-4 text-sm leading-6">
              {data.note}
            </p>
          ) : null}
          <TaskList
            title={t("movingChecklistTasks")}
            tasks={data.movingTasks}
            onToggle={(id) => toggle.mutate(id)}
            pending={busy}
          />
          <TaskList
            title={t("movingOwnerChecks")}
            tasks={data.ownerChecks}
            onToggle={(id) => toggle.mutate(id)}
            pending={busy}
          />
        </>
      )}
    </main>
  );
}
