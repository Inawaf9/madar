"use client";

import { useId, useState, type FormEvent } from "react";
import { propertyTypes } from "@/lib/api/discovery-contracts";
import { useLocale, useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel, FieldSet, FieldLegend } from "@/components/ui/field";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from "@/components/ui/select";
import { CitySelector, RegionSelector } from "@/features/properties/region-city-selector";
import { supportedSearchCity, type RegionId } from "@/lib/property-regions";

export type SearchCriteria = {
  city: string;
  purpose: "rent" | "sale";
  q: string;
  maxPrice: string;
  type?: string;
};

export function PurposeSelector({ value, onChange }: { value: "rent" | "sale"; onChange: (value: "rent" | "sale") => void }) {
  const t = useTranslations("PropertyDiscovery");
  const id = useId();
  return (
    <FieldSet className="gap-2">
      <FieldLegend variant="label">{t("purposeLabel")}</FieldLegend>
      <div className="flex flex-wrap gap-2">
        {(["rent", "sale"] as const).map((purpose) => (
          <label key={purpose} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border bg-background px-4 transition-colors has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground has-focus-visible:ring-2 has-focus-visible:ring-ring">
            <input type="radio" name={`${id}-purpose`} value={purpose} checked={value === purpose} onChange={() => onChange(purpose)} className="size-4 accent-current" />{t(purpose)}
          </label>
        ))}
      </div>
    </FieldSet>
  );
}

export function PropertySearchForm({ criteria, onChange, onSearch }: {
  criteria: SearchCriteria;
  onChange: (next: SearchCriteria) => void;
  onSearch: () => void;
}) {
  const t = useTranslations("PropertyDiscovery");
  const common = useTranslations("Common");
  const locale = useLocale();
  const id = useId();
  const [region, setRegion] = useState<RegionId | null>(supportedSearchCity(criteria.city)?.regionId || null);
  const citySelected = !!region && supportedSearchCity(criteria.city)?.regionId === region;
  const update = <K extends keyof SearchCriteria>(key: K, value: SearchCriteria[K]) => onChange({ ...criteria, [key]: value });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (citySelected) onSearch();
  };
  const types = propertyTypes.map((type) => ({ value: type, label: t(type === "all" ? "allTypes" : type) }));
  const budgets = [
    { value: "any", label: t("noLimit") },
    ...(criteria.purpose === "rent" ? [50000, 75000, 100000] : [700000, 1000000, 1500000]).map((value) => ({
      value: String(value), label: `${new Intl.NumberFormat(locale).format(value)} ${common("currency")}`,
    })),
  ];

  return (
    <form onSubmit={submit} className="flex min-w-0 flex-col gap-4 rounded-[1.375rem] border bg-card p-5 shadow-stone sm:p-6">
      <RegionSelector value={region} onChange={next => {
        setRegion(next);
        if (!next || supportedSearchCity(criteria.city)?.regionId !== next) update("city", "");
      }} />
      <PurposeSelector value={criteria.purpose} onChange={(value) => update("purpose", value)} />
      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        <CitySelector regionId={region} value={criteria.city} onChange={(value) => update("city", value)} />
        <Field>
          <FieldLabel htmlFor={`${id}-query`}>{t("queryLabel")}</FieldLabel>
          <Input id={`${id}-query`} type="search" name="q" value={criteria.q} onChange={(event) => update("q", event.target.value)} placeholder={t("queryPlaceholder")} dir="auto" />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${id}-type`}>{t("typeLabel")}</FieldLabel>
          <Select name="type" value={criteria.type || "all"} items={types} onValueChange={(value) => update("type", value || "all")}>
            <SelectTrigger id={`${id}-type`} className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent><SelectGroup>{types.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectGroup></SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${id}-budget`}>{t(criteria.purpose === "rent" ? "yearlyBudget" : "purchaseBudget")}</FieldLabel>
          <Select name="maxPrice" value={criteria.maxPrice} items={budgets} onValueChange={(value) => update("maxPrice", value || "any")}>
            <SelectTrigger id={`${id}-budget`} className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent><SelectGroup>{budgets.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectGroup></SelectContent>
          </Select>
        </Field>
      </FieldGroup>
      <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p id={`${id}-notice`} className="max-w-sm text-xs leading-6 text-muted-foreground">{t("cityHint")}</p>
        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={!citySelected} aria-describedby={`${id}-notice`}><Search data-icon="inline-start" />{t("searchButton")}</Button>
      </div>
    </form>
  );
}
