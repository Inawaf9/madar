"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { House, LocateFixed } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { QueryFeedback } from "@/components/shared/query-feedback";
import { SummaryPanelSkeleton } from "@/components/shared/page-skeleton";
import { TaskDialog } from "@/components/shared/task-dialog";
import { Button } from "@/components/ui/button";
import { MadarMap } from "@/components/maps/madar-map";
import { neighborhood } from "@/lib/api/neighborhood";
import { currentHomeSchema, type CurrentHome } from "@/lib/api/contracts";
import { homeApi } from "@/lib/api/current-home";
import { invalidateUserData } from "@/features/account/api/invalidation";
import { useHome, useHomeStatus, usePlaces } from "@/features/account/api/query-hooks";
import { useIdentity } from "@/features/account/identity";
import { DataForm, type FormField } from "@/components/forms/data-form";
import { DeleteAction } from "@/components/shared/delete-action";
import { ErrorState } from "@/components/shared/error-state";
import { Panel } from "@/components/shared/panel";
import { CoordinateField } from "./location-fields";
import { getProductCopy } from "@/messages/product-copy";

function ConfirmMove({ userId }: { userId: number }) {
  const copy = getProductCopy(useLocale());
  const cache = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => neighborhood.confirm(),
    onSuccess: () => invalidateUserData(cache, userId),
  });
  return (
    <div className="mt-4 flex flex-col gap-3">
      <Button
        disabled={mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? copy.confirming : copy.confirmMove}
      </Button>
      {mutation.isError ? (
        <ErrorState error={mutation.error} />
      ) : mutation.isSuccess ? (
        <p
          role="status"
          className="text-sm text-primary"
        >
          {copy.moveConfirmed}
        </p>
      ) : null}
    </div>
  );
}
export function HomePanel({
  showMap = true,
  onCenterHome,
}: {
  showMap?: boolean;
  onCenterHome?: () => void;
}) {
  const locale = useLocale();
  const ar = locale === "ar";
  const copy = getProductCopy(locale);
  const t = useTranslations("Workspace");
  const { userId } = useIdentity();
  const query = useHome(userId);
  const status = useHomeStatus(userId);
  const places = usePlaces(userId);
  const cache = useQueryClient();
  const [open, setOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<CurrentHome | null>(null);
  const [busy, setBusy] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  if (query.isPending || status.isPending) return <SummaryPanelSkeleton />;
  if (status.isError && !status.data)
    return (
      <ErrorState
        error={status.error}
        retry={() => void status.refetch()}
      />
    );
  if (query.isError && !query.data)
    return (
      <ErrorState
        error={query.error}
        retry={() => void query.refetch()}
      />
    );
  const home = query.data;
  const fields: FormField[] = [
    {
      name: "latitude",
      label: ar ? "موقع المنزل" : "Home location",
      fullWidth: true,
      render: (props) => (
        <CoordinateField
          {...props}
          presets={(places.data || []).map((p) => ({ ...p, id: String(p.id) }))}
        />
      ),
    },
    { name: "externalPropertyId", required: false, maxLength: 150, advanced: true },
    { name: "source", required: false, maxLength: 50, advanced: true },
  ];
  return (
    <Panel title={t("currentHome")}>
      <QueryFeedback query={query} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-secondary">
            <House className="size-5 text-primary" />
          </span>
          <p className="text-sm">
            {status.data?.status === "NO_HOME"
              ? copy.homeMissing
              : status.data?.status === "HOME_SET"
                ? copy.homePending
                : copy.homeMoved}
          </p>
        </div>
        <Button
          variant={home ? "outline" : "default"}
          onClick={() => {
            setSnapshot(home || null);
            setOpen(true);
          }}
        >
          {home ? t("edit") : ar ? "أضف منزلك" : "Add your home"}
        </Button>
      </div>
      {home ? (
        <div className="mt-4 rounded-2xl border border-border/60 bg-secondary/40 p-4">
          <p className="text-xs text-muted-foreground">{t("homeAddressLabel")}</p>
          <p className="mt-1 text-sm font-medium">{t("homeAddressUnavailable")}</p>
          {home.source && home.externalPropertyId ? (
            <Button
              nativeButton={false}
              render={
                <Link
                  href={`/properties/${encodeURIComponent(home.source)}/${encodeURIComponent(home.externalPropertyId)}`}
                />
              }
              variant="link"
              className="mt-2 h-auto p-0"
            >
              {t("homeListingDetails")}
            </Button>
          ) : null}
          {onCenterHome ? (
            <Button
              type="button"
              variant="outline"
              className="mt-3 w-full justify-center"
              onClick={onCenterHome}
            >
              <LocateFixed data-icon="inline-start" />
              {t("centerHome")}
            </Button>
          ) : null}
        </div>
      ) : null}
      {home?.id && status.data?.status === "HOME_SET" ? (
        <ConfirmMove userId={userId} />
      ) : null}
      {showMap && home ? (
        <details
          open={mapOpen}
          onToggle={(event) => setMapOpen(event.currentTarget.open)}
          className="mt-4"
        >
          <summary className="cursor-pointer rounded-lg py-2 text-sm text-primary">
            {ar ? "عرض المنزل على الخريطة" : "View home on map"}
          </summary>
          {mapOpen ? (
            <MadarMap
              points={[
                {
                  ...home,
                  id: "home",
                  title: t("currentHome"),
                  provenance: "user",
                  kind: "home",
                },
              ]}
            />
          ) : null}
        </details>
      ) : null}
      <TaskDialog
        open={open}
        onOpenChange={setOpen}
        busy={busy}
        title={home ? t("currentHome") : ar ? "أضف منزلك" : "Add your home"}
        description={
          ar
            ? "حدد موقع المنزل. يُسجّل تاريخ الانتقال عند تأكيده؛ مرجع الإعلان اختياري."
            : "Choose your home location. Confirming the move records its date; the listing reference is optional."
        }
      >
        <DataForm
          schema={currentHomeSchema}
          defaults={
            snapshot
              ? {
                  latitude: snapshot.latitude,
                  longitude: snapshot.longitude,
                  externalPropertyId: snapshot.externalPropertyId ?? "",
                  source: snapshot.source ?? "",
                }
              : { latitude: "", longitude: "", externalPropertyId: "", source: "" }
          }
          fields={fields}
          onCancel={() => setOpen(false)}
          onSubmit={async (value) => {
            setBusy(true);
            try {
              const body = {
                latitude: value.latitude,
                longitude: value.longitude,
                externalPropertyId: value.externalPropertyId || undefined,
                source: value.source || undefined,
              };
              if (snapshot?.id) await homeApi.update(snapshot.id, body);
              else await homeApi.add(body);
              await invalidateUserData(cache, userId);
              setOpen(false);
            } finally {
              setBusy(false);
            }
          }}
        />
        {snapshot?.id ? (
          <div className="border-t border-border/60 pt-4">
            <DeleteAction
              onDelete={async () => {
                await homeApi.remove(snapshot.id!);
                await invalidateUserData(cache, userId);
                setOpen(false);
              }}
            />
          </div>
        ) : null}
      </TaskDialog>
    </Panel>
  );
}
