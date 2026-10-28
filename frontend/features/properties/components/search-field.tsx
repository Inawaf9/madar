"use client";

import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SearchFieldProps = {
  fieldKey: string;
  options?: { value: string; label: string }[];
  errors: Record<string, string>;
  draft: Record<string, string>;
  fieldLabels: Record<string, string>;
  arabic: boolean;
  onChange: (key: string, value: string) => void;
};

export function SearchField({
  fieldKey,
  options,
  errors,
  draft,
  fieldLabels,
  arabic,
  onChange,
}: SearchFieldProps) {
  const key = fieldKey;
  const ar = arabic;
  const set = onChange;
  return (
    <Field
      key={key}
      data-invalid={!!errors[key]}
    >
      <FieldLabel htmlFor={`search-${key}`}>{fieldLabels[key]}</FieldLabel>
      {options ? (
        <Select
          name={key}
          value={draft[key] || ""}
          items={options}
          onValueChange={(value) => set(key, value || "")}
        >
          <SelectTrigger
            id={`search-${key}`}
            className="w-full"
            aria-invalid={!!errors[key]}
            aria-describedby={errors[key] ? `search-${key}-error` : undefined}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            align="start"
            alignItemWithTrigger={false}
          >
            <SelectGroup>
              {options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={`search-${key}`}
          name={key}
          value={draft[key] || ""}
          onChange={(e) => set(key, e.target.value)}
          aria-invalid={!!errors[key]}
          aria-describedby={errors[key] ? `search-${key}-error` : undefined}
          dir={key === "q" ? "auto" : "ltr"}
          type={key === "q" ? "text" : "number"}
          placeholder={
            key === "q"
              ? ar
                ? "ابحث باسم الحي أو وصف البيت"
                : "Search neighborhood or description"
              : undefined
          }
          maxLength={key === "q" ? 120 : undefined}
          step={["minArea", "maxArea"].includes(key) ? "any" : "1"}
        />
      )}
      {errors[key] ? (
        <p
          id={`search-${key}-error`}
          role="alert"
          className="text-xs text-destructive"
        >
          {errors[key]}
        </p>
      ) : null}
    </Field>
  );
}
