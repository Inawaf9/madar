"use client";
import { useHydrated } from "@/hooks/use-hydrated";
import { useId, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  useForm,
  useWatch,
  Controller,
  type FieldValues,
  type ControllerRenderProps,
  type FieldErrors,
  type UseFormSetValue,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
import { NumberStepper } from "@/components/forms/number-stepper";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { ChoiceCards } from "@/components/forms/choice-cards";
import { SearchableSelect } from "@/components/forms/searchable-select";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";

import { Alert, AlertDescription } from "@/components/ui/alert";

import { businessErrors, useErrorText } from "@/components/shared/error-state";

const DatePicker = dynamic(
  () => import("@/components/forms/date-picker").then((module) => module.DatePicker),
  { loading: () => <Skeleton className="h-11 w-full rounded-xl" /> },
);
export type FormFieldRenderProps = {
  value: unknown;
  onChange: (value: unknown) => void;
  values: FieldValues;
  setValue: (name: string, value: unknown) => void;
  id: string;
  invalid: boolean;
  describedBy: string;
  inputRef?: (element: HTMLElement | null) => void;
};
export type FormField = {
  name: string;
  label?: string;
  type?: string;
  required?: boolean;
  hint?: string;
  description?: string;
  min?: number;
  max?: number;
  maxLength?: number;
  autoComplete?: string;
  visuallyHiddenLabel?: boolean;
  validationMessage?: string;
  options?: { value: string; label: string; keywords?: string; disabled?: boolean }[];
  control?: "choices" | "search" | "stepper";
  advanced?: boolean;
  fullWidth?: boolean;
  unit?: string;
  render?: (props: FormFieldRenderProps) => React.ReactNode;
};
function ControlledFieldInput({
  controlled: { ref: inputRef, value: fieldValue, onChange, onBlur, name },
  field,
  inputId,
  invalid,
  label,
  values,
  setValue,
  setSuccess,
}: {
  controlled: ControllerRenderProps<FieldValues, string>;
  field: FormField;
  inputId: string;
  invalid: boolean;
  label: string;
  values: FieldValues;
  setValue: UseFormSetValue<FieldValues>;
  setSuccess: (success: boolean) => void;
}) {
  const change = (value: unknown) => {
    onChange(value);
    setSuccess(false);
  };
  const common = {
    id: inputId,
    invalid,
    describedBy: `${inputId}-help`,
    inputRef: inputRef,
  };
  if (field.render)
    return (
      <>
        {field.render({
          ...common,
          value: fieldValue,
          onChange: (value) => {
            onChange(value);
            setSuccess(false);
          },
          values,
          setValue: (name, value) => {
            setValue(name, value, {
              shouldDirty: true,
              shouldValidate: true,
            });
            setSuccess(false);
          },
        })}
      </>
    );
  if (field.control === "stepper")
    return (
      <NumberStepper
        {...common}
        label={label}
        value={typeof fieldValue === "number" ? fieldValue : ""}
        onChange={change}
        min={field.min}
        max={field.max}
      />
    );
  if (field.type === "date")
    return (
      <DatePicker
        {...common}
        value={fieldValue || ""}
        onChange={change}
      />
    );
  if (field.control === "choices")
    return (
      <ChoiceCards
        {...common}
        options={field.options!}
        value={String(fieldValue ?? "")}
        onChange={change}
      />
    );
  if (field.control === "search")
    return (
      <SearchableSelect
        {...common}
        options={field.options!}
        value={String(fieldValue ?? "")}
        onChange={change}
      />
    );
  return (
    <Select
      items={field.options}
      name={name}
      value={String(fieldValue ?? "")}
      onValueChange={change}
    >
      <SelectTrigger
        id={inputId}
        className="h-11 w-full"
        onBlur={onBlur}
        ref={inputRef}
        aria-invalid={invalid}
        aria-describedby={`${inputId}-help`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {field.options!.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export function DataForm<T extends FieldValues>({
  schema,
  fields,
  defaults,
  onSubmit,
  submitLabel,
  onCancel,
  pending = false,
  disabled = false,
  showSuccess = true,
  getSubmitError,
}: {
  schema: z.ZodType<T, FieldValues>;
  fields: FormField[];
  defaults?: FieldValues;
  onSubmit: (value: T) => Promise<void>;
  submitLabel?: string;
  onCancel?: () => void;
  pending?: boolean;
  disabled?: boolean;
  showSuccess?: boolean;
  getSubmitError?: (error: unknown) => string | undefined;
}) {
  const t = useTranslations("Workspace");
  const ar = useLocale() === "ar";
  const errorText = useErrorText();
  const id = useId();
  const ready = useHydrated();
  const [success, setSuccess] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
    setValue,
  } = useForm<FieldValues, unknown, T>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });
  const values = useWatch({ control });
  const renderFields = (list: FormField[]) => (
    <FieldGroup className="grid gap-5 @min-[26rem]/form:grid-cols-2">
      {list.map((field) => {
        const invalid = !!errors[field.name];
        const inputId = `${id}-${field.name}`;
        const label = field.label || t(`fields.${field.name}`);
        return (
          <Field
            key={field.name}
            data-invalid={invalid}
            className={field.fullWidth ? "@min-[26rem]/form:col-span-2" : undefined}
          >
            <FieldLabel
              htmlFor={inputId}
              className={field.visuallyHiddenLabel ? "sr-only" : undefined}
            >
              {label}
              {field.required === false ? (
                <span className="text-xs font-normal text-muted-foreground">
                  {t("optional")}
                </span>
              ) : null}
            </FieldLabel>
            {field.render ||
            field.options ||
            field.type === "date" ||
            field.control === "stepper" ? (
              <Controller
                control={control}
                name={field.name}
                render={({ field: controlled }) => (
                  <ControlledFieldInput
                    controlled={controlled}
                    field={field}
                    inputId={inputId}
                    invalid={invalid}
                    label={label}
                    values={values}
                    setValue={setValue}
                    setSuccess={setSuccess}
                  />
                )}
              />
            ) : (
              <div className="relative">
                <Input
                  id={inputId}
                  className={
                    field.unit
                      ? "h-11 pe-24 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      : "h-11 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  }
                  type={field.type ?? "text"}
                  inputMode={field.type === "number" ? "decimal" : undefined}
                  step={field.type === "number" ? "any" : undefined}
                  min={field.min}
                  max={field.max}
                  maxLength={field.maxLength}
                  autoComplete={field.autoComplete}
                  aria-invalid={invalid}
                  aria-describedby={`${inputId}-help`}
                  {...register(field.name, { valueAsNumber: field.type === "number" })}
                />
                {field.unit ? (
                  <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-xs text-muted-foreground">
                    {field.unit}
                  </span>
                ) : null}
              </div>
            )}
            <div id={`${inputId}-help`}>
              {field.description || field.hint ? (
                <FieldDescription>{field.description || t(field.hint!)}</FieldDescription>
              ) : null}
              {invalid ? (
                <FieldError>
                  {errors[field.name]?.type === "server"
                    ? String(errors[field.name]?.message)
                    : (field.validationMessage ?? t("invalidField", { field: label }))}
                </FieldError>
              ) : null}
            </div>
          </Field>
        );
      })}
    </FieldGroup>
  );
  const handleValidSubmit = async (value: T) => {
    if (pending || disabled) return;
    setSuccess(false);
    clearErrors("root");
    try {
      await onSubmit(value);
      if (showSuccess) {
        setSuccess(true);
        toast.success(t("savedSuccess"));
      }
    } catch (error) {
      const message = error instanceof ApiError ? (error.backendMessage ?? "") : "";
      const serverField = /^Occupants count/.test(message)
        ? "occupantsCount"
        : /^(Email is already|Invalid email|Email is required)/.test(message)
          ? "email"
          : /^Password (must|is required)/.test(message)
            ? "password"
            : /^Full name is required/.test(message)
              ? "fullName"
              : undefined;
      if (serverField && fields.some((field) => field.name === serverField)) {
        setError(
          serverField,
          {
            type: "server",
            message: businessErrors[message]
              ? errorText(error)
              : t("invalidField", { field: t(`fields.${serverField}`) }),
          },
          { shouldFocus: true },
        );
        if (fields.find((field) => field.name === serverField)?.advanced)
          setAdvancedOpen(true);
      } else setError("root", { message: getSubmitError?.(error) ?? errorText(error) });
    }
  };
  const handleInvalidSubmit = (invalid: FieldErrors<FieldValues>) => {
    if (fields.some((field) => field.advanced && invalid[field.name]))
      setAdvancedOpen(true);
  };
  return (
    <form
      data-ready={ready}
      noValidate
      onChange={() => setSuccess(false)}
      onSubmit={handleSubmit(handleValidSubmit, handleInvalidSubmit)}
      className="@container/form flex flex-col gap-5"
    >
      <fieldset
        disabled={isSubmitting || pending || disabled}
        className="flex min-w-0 flex-col gap-5"
      >
        {renderFields(fields.filter((field) => !field.advanced))}
        {fields.some((field) => field.advanced) ? (
          <details
            open={advancedOpen}
            onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}
            className="rounded-xl bg-secondary/30 p-4"
          >
            <summary className="cursor-pointer rounded-md text-sm font-medium">
              {ar ? "خيارات إضافية" : "Additional options"}
            </summary>
            <div className="mt-5">
              {renderFields(fields.filter((field) => field.advanced))}
            </div>
          </details>
        ) : null}
        {errors.root ? (
          <Alert variant="destructive">
            <AlertDescription>{String(errors.root.message)}</AlertDescription>
          </Alert>
        ) : null}
        {success ? (
          <p
            role="status"
            className="text-sm text-primary"
          >
            {t("savedSuccess")}
          </p>
        ) : null}
        <div
          data-form-actions
          className="flex flex-wrap gap-2 pt-1"
        >
          <Button
            type="submit"
            disabled={isSubmitting || pending || disabled}
            aria-busy={isSubmitting || pending}
          >
            {isSubmitting || pending ? (
              <LoaderCircle
                className="animate-spin motion-reduce:animate-none"
                aria-hidden="true"
                data-icon="inline-start"
              />
            ) : null}
            {isSubmitting || pending ? t("working") : (submitLabel ?? t("save"))}
          </Button>
          {onCancel ? (
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting || pending || disabled}
              onClick={onCancel}
            >
              {t("cancel")}
            </Button>
          ) : null}
        </div>
      </fieldset>
    </form>
  );
}
