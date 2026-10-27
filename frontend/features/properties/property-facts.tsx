import { Bath, BedDouble, Ruler } from "lucide-react";
import type { Property } from "@/lib/api/discovery-contracts";
import { cn } from "@/lib/utils";

export function PropertyFacts({
  property,
  locale,
  detailed = false,
  overlay = false,
  hideEmpty = false,
}: {
  property: Pick<Property, "bedrooms" | "bathrooms" | "areaSqm">;
  locale: string;
  detailed?: boolean;
  overlay?: boolean;
  hideEmpty?: boolean;
}) {
  const number = new Intl.NumberFormat(locale);
  const facts = [
    {
      label: locale === "ar" ? "غرف النوم" : "Bedrooms",
      value: property.bedrooms,
      icon: BedDouble,
      unit: "",
    },
    {
      label: locale === "ar" ? "الحمامات" : "Bathrooms",
      value: property.bathrooms,
      icon: Bath,
      unit: "",
    },
    {
      label: locale === "ar" ? "المساحة" : "Area",
      value: property.areaSqm,
      icon: Ruler,
      unit: locale === "ar" ? "م²" : "m²",
    },
  ].filter(
    (fact) =>
      fact.value != null &&
      Number.isFinite(fact.value) &&
      (overlay ? fact.value > 0 : fact.value >= 0),
  );
  if (!facts.length)
    return overlay || hideEmpty ? null : (
      <p className="text-xs leading-6 text-muted-foreground">
        {locale === "ar"
          ? "المساحة وتفاصيل الغرف غير متاحة من المصدر."
          : "Area and room details are unavailable from the source."}
      </p>
    );
  return (
    <dl
      className={cn(
        detailed
          ? "grid grid-cols-2 gap-x-5 gap-y-4"
          : overlay
            ? "flex items-center gap-3 whitespace-nowrap"
            : "flex flex-wrap gap-x-4 gap-y-2",
      )}
    >
      {facts.map(({ label, value, icon: Icon, unit }) => (
        <div
          key={label}
          className={cn(
            "flex min-w-0",
            overlay ? "gap-1.5" : "gap-2",
            detailed ? "items-start" : "items-center text-xs",
            (overlay || !detailed) && "text-muted-foreground",
          )}
        >
          <Icon
            aria-hidden="true"
            className={cn(
              "shrink-0",
              "text-muted-foreground",
              detailed ? "mt-1 size-4" : "size-3.5",
            )}
          />
          <div className={cn(!detailed && "flex items-center gap-1")}>
            <dt className={cn(detailed ? "text-xs text-muted-foreground" : "sr-only")}>
              {label}
            </dt>
            <dd className={cn(detailed && "mt-1 text-base font-medium")}>
              <bdi>
                {number.format(value!)}
                {unit ? ` ${unit}` : ""}
              </bdi>
              {!detailed && !unit ? <span className="sr-only"> {label}</span> : null}
            </dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
