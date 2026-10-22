"use client";

import { useId, type CSSProperties } from "react";
import { useLocale } from "next-intl";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { discoveryRegions, type RegionId } from "@/lib/property-regions";

export function RegionSelector({ value, onChange }: { value: RegionId | null; onChange: (region: RegionId | null) => void }) {
  const locale = useLocale();
  const ar = locale === "ar";
  const id = useId();
  const choices = [{ id: null, ar: "كل المناطق", en: "All regions", accentColor: "var(--muted-foreground)" }, ...discoveryRegions];
  return <div className="min-w-0">
    <p id={id} className="mb-3 text-sm font-medium">{ar ? "١. اختر المنطقة" : "1. Choose a region"}</p>
    <div role="group" aria-labelledby={id} className="flex max-w-full gap-2 overflow-x-auto overscroll-x-contain px-1 py-1.5">
      {choices.map(region => <Button key={region.id || "all"} type="button" variant="outline" aria-pressed={value === region.id}
        onClick={() => onChange(region.id)} style={{ "--region-accent": region.accentColor } as CSSProperties}
        className="shrink-0 rounded-full px-4 aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground">
        <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full bg-(--region-accent) ring-1 ring-current/15" />
        {ar ? region.ar : region.en}
        {value === region.id ? <Check aria-hidden="true" className="size-3.5" /> : null}
      </Button>)}
    </div>
  </div>;
}

export function CitySelector({ regionId, value, onChange, error }: {
  regionId: RegionId | null; value: string; onChange: (city: string) => void; error?: string;
}) {
  const ar = useLocale() === "ar";
  const id = useId();
  const region = discoveryRegions.find(item => item.id === regionId);
  const items = (region?.supportedCities || []).map(city => ({ value: city.apiSlug!, label: ar ? city.ar : city.en }));
  const help = !region ? (ar ? "اختر منطقة أولًا، ثم مدينة محددة للبحث." : "Choose a region, then a specific city to search.")
    : !items.length ? (ar ? "لم يُوثّق دعم مدن هذه المنطقة بعد. اختر منطقة أخرى للبحث." : "City coverage is not documented for this region yet. Choose another region.")
    : (ar ? "تظهر المدن الموثّقة فقط؛ التوفر يخضع للمزوّد." : "Only documented cities are listed; availability depends on the provider.");
  return <Field data-invalid={!!error}>
    <FieldLabel htmlFor={id}>{ar ? "٢. المدينة" : "2. City"} <span aria-hidden="true">*</span></FieldLabel>
    <Select name="city" value={value || null} items={items} onValueChange={next => onChange(next || "")} required disabled={!items.length}>
      <SelectTrigger id={id} className="w-full" aria-required="true" aria-invalid={!!error} aria-describedby={`${id}-help${error ? ` ${id}-error` : ""}`}>
        <SelectValue placeholder={ar ? "اختر المدينة" : "Choose a city"} />
      </SelectTrigger>
      <SelectContent align="start" alignItemWithTrigger={false}><SelectGroup>{items.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectGroup></SelectContent>
    </Select>
    <FieldDescription id={`${id}-help`} aria-live="polite">{help}</FieldDescription>
    {error ? <p id={`${id}-error`} role="alert" className="text-xs text-destructive">{error}</p> : null}
  </Field>;
}
