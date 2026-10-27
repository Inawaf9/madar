"use client";
import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxList,
  ComboboxItem,
} from "@/components/ui/combobox";
import { normalizeLocationName } from "@/lib/locations/normalize-name";

export type SelectOption = {
  value: string;
  label: string;
  keywords?: string;
  disabled?: boolean;
};
export function SearchableSelect({
  options,
  value,
  onChange,
  id,
  placeholder,
  invalid,
  describedBy,
  disabled,
  allowCustom = false,
  inputRef,
}: {
  options: readonly SelectOption[];
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  invalid?: boolean;
  describedBy?: string;
  disabled?: boolean;
  allowCustom?: boolean;
  inputRef?: (element: HTMLElement | null) => void;
}) {
  const ar = useLocale() === "ar";
  const [search, setSearch] = useState("");
  const items = useMemo(() => {
    const list =
      value && !options.some((item) => item.value === value)
        ? [{ value, label: value }, ...options]
        : [...options];
    if (
      allowCustom &&
      search.trim() &&
      !list.some(
        (item) =>
          normalizeLocationName(item.label) === normalizeLocationName(search.trim()),
      )
    )
      list.push({ value: search.trim(), label: search.trim() });
    return list;
  }, [options, value, search, allowCustom]);
  return (
    <Combobox
      onInputValueChange={setSearch}
      items={items}
      value={items.find((item) => item.value === value) || null}
      onValueChange={(item: SelectOption | null) => onChange(item?.value || "")}
      disabled={disabled}
      itemToStringLabel={(item: SelectOption) => item.label}
      itemToStringValue={(item: SelectOption) => item.value}
      isItemEqualToValue={(a: SelectOption, b: SelectOption) => a.value === b.value}
      filter={(item: SelectOption, query: string) =>
        normalizeLocationName(
          `${item.label} ${item.keywords || ""} ${item.value}`,
        ).includes(normalizeLocationName(query))
      }
    >
      <ComboboxInput
        ref={inputRef}
        id={id}
        dir={ar ? "rtl" : "ltr"}
        placeholder={placeholder || (ar ? "ابحث واختر" : "Search and choose")}
        aria-invalid={invalid}
        aria-describedby={describedBy}
      />
      <ComboboxContent dir={ar ? "rtl" : "ltr"}>
        <ComboboxEmpty className="p-4 text-center text-sm text-muted-foreground">
          {ar ? "لا توجد نتائج" : "No matches"}
        </ComboboxEmpty>
        <ComboboxList>
          {(item: SelectOption) => (
            <ComboboxItem
              key={item.value}
              value={item}
              disabled={item.disabled}
            >
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
