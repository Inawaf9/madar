"use client";

import { useTranslations } from "next-intl";
import { z } from "zod";
import {
  DataForm,
  type FormField,
  type FormFieldRenderProps,
} from "@/components/forms/data-form";
import { ChoiceCards } from "@/components/forms/choice-cards";
import {
  HousingCityField,
  HousingDistrictField,
  HousingRegionField,
} from "@/features/account/location-fields";
import { MadarMap } from "@/components/maps/madar-map";
import { Input } from "@/components/ui/input";
import { FieldLabel } from "@/components/ui/field";
import { validCoordinates } from "@/lib/maps/points";
import {
  housingPreferenceSchema,
  placeSchema,
  type HousingPreference,
  type HousingPreferenceInput,
  type PlaceInput,
  type PlacePreference,
} from "@/lib/api/contracts";

const smartPlaceSchema = placeSchema
  .omit({ type: true })
  .extend({ visitPerWeek: z.number().int().min(1) });

export function SearchHousingForm({
  existing,
  onSave,
  onCancel,
}: {
  existing: HousingPreference | null;
  onSave: (value: HousingPreferenceInput) => Promise<void>;
  onCancel: () => void;
}) {
  const t = useTranslations("Workspace");
  const d = useTranslations("PropertyDiscovery");
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
    {
      name: "propertyType",
      options: [
        { value: "apartment", label: d("apartment") },
        { value: "villa", label: d("villa") },
        { value: "floor", label: d("floor") },
        { value: "duplex", label: d("duplex") },
        { value: "building", label: d("building") },
      ],
      control: "choices",
      fullWidth: true,
    },
    { name: "city", render: (props) => <HousingCityField {...props} /> },
    { name: "region", render: (props) => <HousingRegionField {...props} /> },
    {
      name: "maxBudget",
      type: "number",
      min: 1,
      unit: "SAR",
      description: d("budgetPeriodHint"),
    },
    { name: "occupantsCount", control: "stepper", type: "number", min: 1 },
    {
      name: "includeNearbyServices",
      label: d("includeServices"),
      fullWidth: true,
      advanced: true,
      render: (props) => (
        <ChoiceCards
          {...props}
          value={props.value === false ? "false" : "true"}
          options={[
            { value: "true", label: d("yes") },
            { value: "false", label: d("no") },
          ]}
          onChange={(value) => props.onChange(value === "true")}
        />
      ),
    },
    {
      name: "district",
      required: false,
      fullWidth: true,
      advanced: true,
      render: (props) => <HousingDistrictField {...props} />,
    },
  ];
  return (
    <DataForm
      key={existing?.id ?? "new"}
      schema={housingPreferenceSchema}
      fields={fields}
      defaults={
        existing
          ? {
              region: existing.region,
              city: existing.city,
              district: existing.district ?? "",
              maxBudget: existing.maxBudget,
              occupantsCount: existing.occupantsCount ?? "",
              propertyType: existing.propertyType,
              listingType: existing.listingType,
              includeNearbyServices: existing.includeNearbyServices ?? true,
            }
          : {
              region: "",
              city: "",
              district: "",
              maxBudget: "",
              occupantsCount: "",
              propertyType: "",
              listingType: "rent",
              includeNearbyServices: true,
            }
      }
      onSubmit={onSave}
      onCancel={onCancel}
      submitLabel={d("save")}
      showSuccess={false}
    />
  );
}

export function SearchPlaceForm({
  existing,
  onSave,
  onCancel,
}: {
  existing: PlacePreference | null;
  onSave: (value: PlaceInput) => Promise<void>;
  onCancel: () => void;
}) {
  const d = useTranslations("PropertyDiscovery");
  const fields: FormField[] = [
    { name: "name", maxLength: 100, fullWidth: true },
    {
      name: "latitude",
      label: d("location"),
      fullWidth: true,
      render: (props) => (
        <InlineCoordinateField
          {...props}
          label={d("location")}
        />
      ),
    },
    {
      name: "visitPerWeek",
      label: d("visitsPerWeek"),
      control: "stepper",
      type: "number",
      min: 1,
    },
    {
      name: "importance",
      label: d("importance"),
      control: "stepper",
      type: "number",
      min: 1,
      max: 5,
    },
  ];
  return (
    <DataForm
      key={existing?.id ?? "new"}
      schema={smartPlaceSchema}
      fields={fields}
      defaults={
        existing ?? {
          name: "",
          type: "",
          latitude: "",
          longitude: "",
          importance: 3,
          visitPerWeek: 1,
        }
      }
      onSubmit={(value) =>
        onSave({ ...value, type: existing?.type || value.name.slice(0, 50) })
      }
      onCancel={onCancel}
      submitLabel={d("save")}
      showSuccess={false}
    />
  );
}

function InlineCoordinateField({
  label,
  value,
  values,
  onChange,
  setValue,
  id,
  inputRef,
  invalid,
  describedBy,
}: FormFieldRenderProps & { label: string }) {
  const t = useTranslations("PropertyDiscovery");
  const latitude = value;
  const longitude = values.longitude;
  const selected = validCoordinates(latitude, longitude)
    ? { latitude: Number(latitude), longitude: Number(longitude) }
    : null;
  const readNumber = (value: string) => (value === "" ? "" : Number(value));

  return (
    <div className="space-y-3">
      <MadarMap
        points={[]}
        label={label}
        locationSelection={{
          value: selected,
          onChange: (point) => {
            onChange(point.latitude);
            setValue("longitude", point.longitude);
          },
        }}
      />
      <p
        role="status"
        className="text-xs text-muted-foreground"
      >
        {selected ? t("locationSelected") : t("chooseLocation")}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <FieldLabel htmlFor={id}>{t("latitude")}</FieldLabel>
          <Input
            id={id}
            ref={inputRef}
            type="number"
            inputMode="decimal"
            step="any"
            min={-90}
            max={90}
            dir="ltr"
            value={typeof latitude === "number" ? latitude : ""}
            onChange={(event) => onChange(readNumber(event.target.value))}
            aria-invalid={invalid}
            aria-describedby={describedBy}
          />
        </div>
        <div className="space-y-1">
          <FieldLabel htmlFor={`${id}-longitude`}>{t("longitude")}</FieldLabel>
          <Input
            id={`${id}-longitude`}
            type="number"
            inputMode="decimal"
            step="any"
            min={-180}
            max={180}
            dir="ltr"
            value={typeof longitude === "number" ? longitude : ""}
            onChange={(event) => setValue("longitude", readNumber(event.target.value))}
            aria-invalid={longitude !== "" && !selected}
          />
        </div>
      </div>
      {(latitude !== "" || longitude !== "") && !selected ? (
        <p
          role="alert"
          className="text-xs text-destructive"
        >
          {t("invalidLocation")}
        </p>
      ) : null}
    </div>
  );
}
