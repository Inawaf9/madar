"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  locationCatalogKey,
  locationNeighborhoodKey,
} from "@/lib/api/location-query-options";
import type { LocationCatalog, LocationNeighborhood } from "@/lib/api/locations";
import { useLocale } from "next-intl";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldSet, FieldLegend } from "@/components/ui/field";
import { assistantActionRegistry, type ToolInput } from "../assistant-action-registry";
import { assistantToolBlockSchema } from "../assistant-action-schemas";
import {
  toolDefaults,
  placeOptions,
  propertyOptions,
} from "../assistant-interaction-state";
import { useAssistant } from "../assistant-context";
import type { ToolBlock } from "../types";
import { ActionField } from "./action-field";
import { AccountContextPanel } from "./account-context-panel";
import { AssistantToolResult } from "./assistant-tool-result";
import { actionLabel } from "../action-labels";

function InputSummary({ block, input }: { block: ToolBlock; input: ToolInput }) {
  const ar = useLocale() === "ar";
  const { state, accountData } = useAssistant();
  const definition = assistantActionRegistry[block.tool];
  const references = [
    ...placeOptions(accountData.account).map((place) => ({
      id: place.id,
      label: place.name,
    })),
    ...propertyOptions(accountData.account, state.selections, ar).map((property) => ({
      id: property.id,
      label: property.title,
    })),
  ];
  return (
    <dl className="flex min-w-0 flex-col gap-1 text-xs leading-5">
      {block.tool === "save-property" ? (
        <div>
          {input.save
            ? ar
              ? "طلب حفظ يحتاج تأكيدًا في صفحة البيت"
              : "Save request needs confirmation on the home page"
            : ar
              ? "طلب إزالة لم يُنفذ"
              : "Removal request was not completed"}
        </div>
      ) : null}
      {definition.fields
        .filter((field) => input[field.name] != null && input[field.name] !== "")
        .map((field) => (
          <div
            key={field.name}
            className="min-w-0"
          >
            <dt className="inline text-muted-foreground">{field.label[ar ? 0 : 1]}: </dt>
            <dd className="inline wrap-break-word">
              {field.kind === "map"
                ? ar
                  ? "موقع محدد على الخريطة"
                  : "Point selected on map"
                : Array.isArray(input[field.name])
                  ? (input[field.name] as string[])
                      .map(
                        (value) =>
                          references.find((item) => item.id === value)?.label ||
                          actionLabel(value, ar),
                      )
                      .join(" · ") || (ar ? "لا اختيارات" : "None")
                  : field.kind === "neighborhood"
                    ? ar
                      ? "حي من كتالوج المدينة"
                      : "Neighborhood from city catalog"
                    : typeof input[field.name] === "number"
                      ? new Intl.NumberFormat(ar ? "ar" : "en").format(
                          input[field.name] as number,
                        )
                      : actionLabel(String(input[field.name]), ar)}
            </dd>
          </div>
        ))}
      {definition.fields.length === 0 && "id" in input ? (
        <div>
          {references.find((item) => item.id === input.id)?.label ||
            (ar ? "العنصر المحدد" : "Selected item")}
        </div>
      ) : null}
    </dl>
  );
}
export function AssistantToolBlock({ block }: { block: ToolBlock }) {
  const ar = useLocale() === "ar";
  const { state, submitTool, cancelTool, editTool, busy } = useAssistant();
  if (!assistantToolBlockSchema.safeParse(block).success)
    return (
      <p role="alert">{ar ? "هذا الإجراء غير معتمد." : "This action is not approved."}</p>
    );
  const record = state.interactions[block.id];
  if (record?.status === "completed")
    return (
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex items-start gap-1.5">
          <Check
            className="mt-1 size-3.5 shrink-0 text-primary"
            aria-hidden="true"
          />
          <p
            role="status"
            className="min-w-0 flex-1 text-xs leading-6 text-muted-foreground"
          >
            {record.result?.summary}
          </p>
          <Button
            size="sm"
            variant="ghost"
            className="min-h-10 px-2"
            disabled={busy}
            onClick={() => editTool(block)}
          >
            {ar ? "تعديل" : "Edit"}
          </Button>
        </div>
        <InputSummary
          block={block}
          input={record.input}
        />
        {record.result ? <AssistantToolResult result={record.result} /> : null}
      </div>
    );
  if (record?.status === "cancelled")
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <X
          className="size-3.5"
          aria-hidden="true"
        />
        {ar ? "أُلغي الإجراء؛ لم تتغير البيانات." : "Cancelled; no data changed."}
        <Button
          size="sm"
          variant="ghost"
          disabled={busy}
          onClick={() => editTool(block)}
        >
          {ar ? "استئناف" : "Resume"}
        </Button>
      </div>
    );
  if (record?.confirmation)
    return (
      <div className="flex min-w-0 flex-col gap-2 rounded-xl bg-secondary/30 p-3">
        <p className="text-xs font-semibold">
          {assistantActionRegistry[block.tool].title[ar ? 0 : 1]}
        </p>
        <p className="text-xs font-medium">
          {ar
            ? "تأكيد الاختيار المحلي؟ الحساب لن يتغير؛ الحفظ يحتاج إجراءً منفصلًا."
            : "Confirm this local selection? Account saving requires a separate action."}
        </p>
        <InputSummary
          block={block}
          input={record.input}
        />
        <div className="flex flex-wrap gap-1">
          <Button
            size="sm"
            className="min-h-10 rounded-full"
            disabled={busy}
            onClick={() => submitTool(block, record.input, true)}
          >
            {ar ? "تأكيد الاختيار" : "Confirm selection"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => editTool(block)}
          >
            {ar ? "تعديل" : "Edit"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => cancelTool(block)}
          >
            {ar ? "إلغاء" : "Cancel"}
          </Button>
        </div>
      </div>
    );
  return <ToolForm block={block} />;
}
function ToolForm({ block }: { block: ToolBlock }) {
  const ar = useLocale() === "ar";
  const cache = useQueryClient();
  const { state, submitTool, cancelTool, editTool, busy } = useAssistant();
  const definition = assistantActionRegistry[block.tool];
  const record = state.interactions[block.id];
  const [input, setInput] = useState<ToolInput>(() => ({
    ...definition.defaults,
    ...toolDefaults(block.tool, state.selections),
    ...block.initial,
    ...record?.input,
  }));
  const [page, setPage] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const pages = Math.max(1, Math.ceil(definition.fields.length / 2));
  const visible = definition.fields.slice(page * 2, page * 2 + 2);
  const submitting = record?.status === "submitting";
  const clean = () =>
    Object.fromEntries(
      Object.entries(input).filter(
        ([key, value]) =>
          value !== undefined &&
          !(
            value === "" &&
            definition.fields.find((field) => field.name === key)?.optional
          ),
      ),
    );
  const errors = { ...record?.fieldErrors, ...fieldErrors };
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-1">
        <h4 className="text-xs font-semibold">{definition.title[ar ? 0 : 1]}</h4>
        <span className="text-caption text-muted-foreground">
          {page + 1}/{pages}
        </span>
      </div>
      {[
        "destinations",
        "saved-properties",
        "comparison",
        "commute",
        "housing",
        "search",
      ].includes(block.tool) ? (
        <details>
          <summary className="cursor-pointer py-1 text-caption text-muted-foreground">
            {ar ? "بيانات موجودة في حسابي" : "Existing account data"}
          </summary>
          <AccountContextPanel />
        </details>
      ) : null}
      <form
        onFocus={() => {
          if (record?.status === "idle") editTool(block);
        }}
        onSubmit={(event) => {
          event.preventDefault();
          if (busy) return;
          const value = clean();
          if (definition.fields.some((field) => field.kind === "city") && value.city) {
            const cities = cache.getQueryData<LocationCatalog>(locationCatalogKey);
            if (!cities?.some((city) => city.slug === value.city)) {
              setFieldErrors({
                city: ar
                  ? "اختر مدينة متاحة بعد اكتمال تحميل الكتالوج."
                  : "Choose an available city after the catalog loads.",
              });
              setPage(0);
              return;
            }
            if (value.neighborhoodId != null) {
              const neighborhoods = cache.getQueryData<LocationNeighborhood[]>(
                locationNeighborhoodKey(String(value.city)),
              );
              if (!neighborhoods?.some((item) => item.id === value.neighborhoodId)) {
                setFieldErrors({
                  neighborhoodId: ar
                    ? "اختر حيًا من المدينة أو امسح الاختيار."
                    : "Choose a neighborhood in this city or clear it.",
                });
                setPage(1);
                return;
              }
            }
          }
          if (page < pages - 1 && block.tool !== "search") {
            const checked = definition.schema.safeParse(value);
            const fields = visible.flatMap((field) =>
              field.kind === "map" ? ["latitude", "longitude"] : [field.name],
            );
            const problems = checked.success
              ? []
              : checked.error.issues.filter((issue) =>
                  fields.includes(String(issue.path[0])),
                );
            if (problems.length) {
              setFieldErrors(
                Object.fromEntries(
                  problems.map((issue) => [
                    String(issue.path[0]),
                    ar ? "تحقق من القيمة وحدودها" : "Check the value and range",
                  ]),
                ),
              );
              return;
            }
            setFieldErrors({});
            setPage(page + 1);
            return;
          }
          const checked = definition.schema.safeParse(value);
          if (!checked.success) {
            const first = definition.fields.findIndex((field) =>
              checked.error.issues.some(
                (issue) =>
                  issue.path[0] === field.name ||
                  (field.kind === "map" && issue.path[0] === "longitude"),
              ),
            );
            if (first >= 0) setPage(Math.floor(first / 2));
          }
          submitTool(block, value);
        }}
      >
        <FieldSet
          disabled={busy}
          className="gap-3"
        >
          <FieldLegend className="sr-only">{definition.title[ar ? 0 : 1]}</FieldLegend>
          {visible.map((field) => (
            <ActionField
              key={field.name}
              field={field}
              tool={block.tool}
              input={input}
              disabled={busy}
              error={
                errors[field.name] ||
                (field.kind === "map" ? errors.longitude : undefined)
              }
              set={(patch) => {
                setInput((old) => ({ ...old, ...patch }));
                setFieldErrors({});
              }}
            />
          ))}
          {record?.status === "failed" ? (
            <p
              role="alert"
              className="text-xs text-destructive"
            >
              {record.error}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-1">
            {page > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => setPage(page - 1)}
              >
                {ar ? "السابق" : "Back"}
              </Button>
            ) : null}
            <Button
              type="submit"
              size="sm"
              className="min-h-10 rounded-full"
              disabled={busy}
            >
              {submitting
                ? ar
                  ? "نطبّق اختيارك"
                  : "Applying selection"
                : record?.status === "failed"
                  ? ar
                    ? "إعادة المحاولة"
                    : "Retry"
                  : page < pages - 1 && block.tool !== "search"
                    ? ar
                      ? "التالي"
                      : "Next"
                    : definition.confirmation
                      ? ar
                        ? "مراجعة التغيير"
                        : "Review change"
                      : ar
                        ? "استخدام الاختيار"
                        : "Use selection"}
            </Button>
            {block.tool === "search" && page < pages - 1 ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => setPage(page + 1)}
              >
                {ar ? "فلاتر إضافية" : "More filters"}
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="min-h-10"
              onClick={() => cancelTool(block, input)}
            >
              {ar ? "إلغاء" : "Cancel"}
            </Button>
          </div>
        </FieldSet>
      </form>
      {submitting ? (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => cancelTool(block, input)}
        >
          {ar ? "إيقاف الإجراء" : "Stop action"}
        </Button>
      ) : null}
    </div>
  );
}
