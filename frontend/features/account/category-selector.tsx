"use client";
import { useId } from "react";
import { useLocale } from "next-intl";
import {
  Coffee,
  Dumbbell,
  Hospital,
  Pill,
  School,
  ShoppingBag,
  ShoppingBasket,
  Trees,
  Utensils,
} from "lucide-react";
import { categories } from "@/lib/api/discovery-contracts";
import { categoryLabel } from "@/lib/maps/place-presentation";
import { FieldSet, FieldLegend } from "@/components/ui/field";
import { lifestyleInterestGroups } from "@/lib/lifestyle-interest-options";
const icons = {
  supermarket: ShoppingBasket,
  hospital: Hospital,
  pharmacy: Pill,
  park: Trees,
  gym: Dumbbell,
  cafe: Coffee,
  restaurant: Utensils,
  school: School,
  shopping_mall: ShoppingBag,
};
export function CategorySelector({
  value,
  onChange,
  disabled,
  lifestyle = false,
}: {
  value: readonly string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  lifestyle?: boolean;
}) {
  const ar = useLocale() === "ar";
  const id = useId();
  if (lifestyle)
    return (
      <div className="flex flex-col gap-3">
        {lifestyleInterestGroups.map((group) => (
          <details
            key={group.title.en}
            className="rounded-xl border border-border/60 p-3"
          >
            <summary className="cursor-pointer text-sm font-medium">
              {ar ? group.title.ar : group.title.en} ·{" "}
              {group.options.filter(([code]) => value.includes(code)).length}
            </summary>
            <FieldSet
              disabled={disabled}
              className="mt-3"
            >
              <FieldLegend className="sr-only">
                {ar ? group.title.ar : group.title.en}
              </FieldLegend>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {group.options.map(([code, labelAr, labelEn]) => (
                  <label
                    key={code}
                    htmlFor={`${id}-${code}`}
                    className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border/60 p-3 has-checked:border-primary/60 has-checked:bg-primary/8 has-disabled:cursor-not-allowed has-disabled:opacity-60"
                  >
                    <input
                      id={`${id}-${code}`}
                      type="checkbox"
                      className="size-4 shrink-0 accent-primary"
                      checked={value.includes(code)}
                      onChange={(event) =>
                        onChange(
                          event.target.checked
                            ? [...value, code]
                            : value.filter((item) => item !== code),
                        )
                      }
                    />
                    <span className="text-sm">{ar ? labelAr : labelEn}</span>
                  </label>
                ))}
              </div>
            </FieldSet>
          </details>
        ))}
      </div>
    );
  return (
    <FieldSet disabled={disabled}>
      <FieldLegend className="sr-only">
        {ar ? "تصنيفات الخدمات" : "Service categories"}
      </FieldLegend>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const Icon = icons[category];
          return (
            <label
              key={category}
              htmlFor={`${id}-${category}`}
              className="flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border border-border/60 p-3 transition-colors has-checked:border-primary/60 has-checked:bg-primary/8 has-disabled:cursor-not-allowed has-disabled:opacity-60 motion-reduce:transition-none"
            >
              <input
                id={`${id}-${category}`}
                type="checkbox"
                className="size-4 shrink-0 accent-primary"
                checked={value.includes(category)}
                onChange={(event) =>
                  onChange(
                    event.target.checked
                      ? [...value, category]
                      : value.filter((item) => item !== category),
                  )
                }
              />
              <Icon
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground"
              />
              <span className="text-sm">
                {ar ? categoryLabel(category) : category.replaceAll("_", " ")}
              </span>
            </label>
          );
        })}
      </div>
    </FieldSet>
  );
}
