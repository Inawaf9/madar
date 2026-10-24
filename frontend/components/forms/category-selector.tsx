"use client";
import { useId } from "react";
import { useLocale } from "next-intl";
import { Coffee, Dumbbell, Hospital, Pill, School, ShoppingBag, ShoppingBasket, Trees, Utensils } from "lucide-react";
import { categories } from "@/lib/api/discovery-contracts";
import { categoryLabel } from "@/lib/maps/place-presentation";
import { FieldSet, FieldLegend } from "@/components/ui/field";
const icons = { supermarket: ShoppingBasket, hospital: Hospital, pharmacy: Pill, park: Trees, gym: Dumbbell, cafe: Coffee, restaurant: Utensils, school: School, shopping_mall: ShoppingBag };
export function CategorySelector({ value, onChange, disabled }: { value: readonly string[]; onChange: (value: string[]) => void; disabled?: boolean }) {
  const ar = useLocale() === "ar"; const id = useId();
  return <FieldSet disabled={disabled}><FieldLegend className="sr-only">{ar ? "اهتمامات الخدمات" : "Service interests"}</FieldLegend><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{categories.map(category => { const Icon = icons[category]; return <label key={category} htmlFor={`${id}-${category}`} className="flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border border-border/60 p-3 transition-colors has-checked:border-primary/60 has-checked:bg-primary/8 has-disabled:cursor-not-allowed has-disabled:opacity-60 motion-reduce:transition-none"><input id={`${id}-${category}`} type="checkbox" className="size-4 shrink-0 accent-primary" checked={value.includes(category)} onChange={event => onChange(event.target.checked ? [...value, category] : value.filter(item => item !== category))} /><Icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" /><span className="text-sm">{ar ? categoryLabel(category) : category.replaceAll("_", " ")}</span></label>; })}</div></FieldSet>;
}
