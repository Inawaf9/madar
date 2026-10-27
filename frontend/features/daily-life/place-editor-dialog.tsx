"use client";

import { useTranslations } from "next-intl";
import { DataForm, type FormField } from "@/components/forms/data-form";
import { TaskDialog } from "@/components/shared/task-dialog";
import { placeSchema, type PlaceInput, type PlacePreference } from "@/lib/api/contracts";
import { CoordinateField } from "@/features/account/location-fields";

export function PlaceEditorDialog({
  open,
  onOpenChange,
  place,
  busy,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  place: PlacePreference | null;
  busy: boolean;
  onSave: (value: PlaceInput) => Promise<void>;
}) {
  const t = useTranslations("Workspace");
  const fields: FormField[] = [
    { name: "name", maxLength: 100, fullWidth: true },
    { name: "type", maxLength: 50, description: t("placeTypeHint") },
    {
      name: "latitude",
      label: t("placeLocation"),
      fullWidth: true,
      render: (props) => <CoordinateField {...props} />,
    },
    { name: "importance", control: "stepper", type: "number", min: 1, max: 5 },
    { name: "visitPerWeek", control: "stepper", type: "number", min: 0 },
  ];

  return (
    <TaskDialog
      open={open}
      onOpenChange={onOpenChange}
      busy={busy}
      title={place ? t("editLocation") : t("addLocation")}
      description={t("placeEditorHint")}
    >
      <DataForm
        key={place?.id ?? "new"}
        schema={placeSchema}
        fields={fields}
        defaults={
          place ?? {
            name: "",
            type: "",
            latitude: "",
            longitude: "",
            importance: 3,
            visitPerWeek: 1,
          }
        }
        onSubmit={onSave}
        onCancel={() => onOpenChange(false)}
        showSuccess={false}
      />
    </TaskDialog>
  );
}
