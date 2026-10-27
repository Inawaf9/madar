"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { saveSelectedInterests } from "@/lib/api/lifestyle-interests";
import { QueryFeedback } from "@/components/shared/query-feedback";
import { SummaryPanelSkeleton } from "@/components/shared/page-skeleton";
import { TaskDialog } from "@/components/shared/task-dialog";
import { Button } from "@/components/ui/button";
import { housingPreferenceSchema, type HousingPreference } from "@/lib/api/contracts";
import { preferencesApi } from "@/lib/api/preferences";
import { invalidateUserData } from "@/features/account/api/invalidation";
import { useHousing } from "@/features/account/api/query-hooks";
import { useIdentity } from "@/features/account/identity";
import { DataForm, type FormField } from "@/components/forms/data-form";
import { DeleteAction } from "@/components/shared/delete-action";
import { ErrorState } from "@/components/shared/error-state";
import { Panel } from "@/components/shared/panel";
import { CategorySelector } from "@/features/account/category-selector";
import { ChoiceCards } from "@/components/forms/choice-cards";
import {
  HousingCityField,
  HousingDistrictField,
  HousingRegionField,
} from "./location-fields";

const housingFormSchema = housingPreferenceSchema.extend({
  interests: z.array(z.string().min(1)),
});
export function HousingPanel() {
  const ar = useLocale() === "ar";
  const t = useTranslations("Workspace");
  const { userId } = useIdentity();
  const query = useHousing(userId);
  const cache = useQueryClient();
  const [open, setOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<HousingPreference | null>(null);
  const [busy, setBusy] = useState(false);
  if (query.isPending) return <SummaryPanelSkeleton />;
  if (query.isError && !query.data)
    return (
      <ErrorState
        error={query.error}
        retry={() => void query.refetch()}
      />
    );
  const pref = query.data;
  const types = [
    { value: "apartment", label: ar ? "شقة" : "Apartment" },
    { value: "villa", label: ar ? "فيلا" : "Villa" },
    { value: "floor", label: ar ? "دور" : "Floor" },
    { value: "duplex", label: ar ? "دوبلكس" : "Duplex" },
    { value: "building", label: ar ? "عمارة" : "Building" },
  ];
  const fields: FormField[] = [
    {
      name: "listingType",
      options: [
        { value: "rent", label: t("rent") },
        { value: "sale", label: t("sale") },
      ],
      control: "choices",
      fullWidth: true,
    },
    { name: "propertyType", options: types, control: "choices", fullWidth: true },
    { name: "city", render: (props) => <HousingCityField {...props} /> },
    {
      name: "region",
      maxLength: 100,
      render: (props) => <HousingRegionField {...props} />,
    },
    {
      name: "maxBudget",
      type: "number",
      min: 1,
      unit: "SAR",
      description: ar
        ? "للإيجار: الميزانية السنوية. للبيع: السعر الإجمالي."
        : "Rent: annual budget. Purchase: total price.",
    },
    {
      name: "occupantsCount",
      control: "stepper",
      type: "number",
      min: 1,
      max: 2147483647,
    },
    {
      name: "includeNearbyServices",
      label: ar ? "احتساب الخدمات القريبة" : "Include nearby services",
      fullWidth: true,
      advanced: true,
      render: (props) => (
        <ChoiceCards
          {...props}
          value={props.value === false ? "false" : "true"}
          options={[
            { value: "true", label: ar ? "نعم، احتسبها" : "Yes, include them" },
            { value: "false", label: ar ? "لا، بدون الخدمات" : "No, exclude them" },
          ]}
          onChange={(value) => props.onChange(value === "true")}
        />
      ),
    },
    {
      name: "district",
      required: false,
      advanced: true,
      fullWidth: true,
      render: (props) => <HousingDistrictField {...props} />,
    },
    {
      name: "interests",
      label: ar ? "الخدمات التي تهمك" : "Services that matter",
      required: false,
      advanced: true,
      fullWidth: true,
      render: (props) => (
        <CategorySelector
          lifestyle
          value={Array.isArray(props.value) ? props.value : []}
          onChange={props.onChange}
        />
      ),
    },
  ];
  return (
    <Panel title={t("housingPreferences")}>
      <QueryFeedback query={query} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {pref
              ? [
                  types.find((type) => type.value === pref.propertyType)?.label ||
                    pref.propertyType,
                  t(pref.listingType),
                ].join(" · ")
              : ar
                ? "وش تبي في بيتك القادم؟"
                : "What matters in your next home?"}
          </p>
          {pref ? (
            <p className="mt-2 text-sm text-muted-foreground">
              <bdi>{pref.city}</bdi> ·{" "}
              {new Intl.NumberFormat(ar ? "ar" : "en", {
                style: "currency",
                currency: "SAR",
                maximumFractionDigits: 0,
              }).format(pref.maxBudget)}{" "}
              {pref.listingType === "rent" ? (ar ? "سنويًا" : "per year") : ""}
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              {ar
                ? "اختر نوع السكن والمدينة والميزانية."
                : "Choose your property type, city and budget."}
            </p>
          )}
        </div>
        <Button
          variant={pref ? "outline" : "default"}
          onClick={() => {
            setSnapshot(pref || null);
            setOpen(true);
          }}
        >
          {pref ? t("edit") : ar ? "إعداد التفضيلات" : "Set preferences"}
        </Button>
      </div>
      <TaskDialog
        open={open}
        onOpenChange={setOpen}
        busy={busy}
        title={t("housingPreferences")}
        description={
          ar
            ? "اختياراتك الحالية محفوظة ويمكن تعديلها متى رغبت."
            : "Your current choices are saved and can be updated anytime."
        }
      >
        <DataForm
          schema={housingFormSchema}
          defaults={
            snapshot
              ? {
                  region: snapshot.region,
                  city: snapshot.city,
                  district: snapshot.district ?? "",
                  maxBudget: snapshot.maxBudget,
                  occupantsCount: snapshot.occupantsCount ?? "",
                  propertyType: snapshot.propertyType,
                  listingType: snapshot.listingType,
                  includeNearbyServices: snapshot.includeNearbyServices ?? true,
                  interests: snapshot.interests,
                }
              : {
                  region: "",
                  city: "",
                  district: "",
                  maxBudget: "",
                  occupantsCount: "",
                  includeNearbyServices: true,
                  interests: [],
                  propertyType: "",
                  listingType: "rent",
                }
          }
          fields={fields}
          onCancel={() => setOpen(false)}
          onSubmit={async (value) => {
            setBusy(true);
            try {
              const body = housingPreferenceSchema.parse(value);
              if (snapshot?.id) await preferencesApi.update(snapshot.id, body);
              else await preferencesApi.add(body);
              if (
                JSON.stringify([...value.interests].sort()) !==
                JSON.stringify([...(snapshot?.interests ?? [])].sort())
              )
                await saveSelectedInterests(value.interests);
              setOpen(false);
            } finally {
              await invalidateUserData(cache, userId);
              setBusy(false);
            }
          }}
        />
        {snapshot?.id ? (
          <div className="border-t border-border/60 pt-4">
            <DeleteAction
              onDelete={async () => {
                await preferencesApi.remove(snapshot.id!);
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
