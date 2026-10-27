"use client";
import { administrativeRegions } from "@/lib/locations/saudi-regions";
import { useLocale } from "next-intl";
import { useLocationSelection } from "@/features/locations/location-hooks";
import { LocationCatalogFailure } from "@/features/locations/location-selectors";
import { locationLabel } from "@/lib/api/locations";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchableSelect } from "@/components/forms/searchable-select";
import { LocationPicker, type LocationPreset } from "@/components/forms/location-picker";
import { validCoordinates } from "@/lib/maps/points";
import type { FormFieldRenderProps } from "@/components/forms/data-form";

/** Independent reference choices: no unverified city-to-region assignment. */
export function HousingRegionField(props: FormFieldRenderProps) {
  const locale = useLocale();
  return (
    <SearchableSelect
      {...props}
      value={String(props.value || "")}
      onChange={props.onChange}
      allowCustom
      options={administrativeRegions.map((region) => ({
        value: region.ar,
        label: locale === "ar" ? region.ar : region.en,
        keywords: `${region.ar} ${region.en} ${region.id}`,
      }))}
    />
  );
}
export function HousingCityField(props: FormFieldRenderProps) {
  const locale = useLocale();
  const ar = locale === "ar";
  const value = String(props.value || "");
  const { cities } = useLocationSelection(value);
  return (
    <div className="flex flex-col gap-2">
      {cities.isPending ? (
        <Skeleton className="h-11 w-full" />
      ) : (
        <SearchableSelect
          {...props}
          value={value}
          options={(cities.data || [])
            .map((item) => ({
              value: item.slug,
              label: locationLabel(item, locale),
              keywords: `${item.nameAr} ${item.nameEn}`,
            }))
            .sort((a, b) => a.label.localeCompare(b.label, locale))}
          onChange={(city) => {
            props.onChange(city);
            props.setValue("district", "");
          }}
        />
      )}
      {cities.isError ? <LocationCatalogFailure query={cities} /> : null}
      {value && !/^[a-z-]+$/.test(value) ? (
        <p className="text-xs text-destructive">
          {ar
            ? "لا يمكن حفظ تفضيلات هذه المدينة حاليًا. اختر مدينة أخرى."
            : "Housing preferences cannot be saved for this city yet. Choose another city."}
        </p>
      ) : null}
    </div>
  );
}
export function HousingDistrictField(props: FormFieldRenderProps) {
  const locale = useLocale();
  const ar = locale === "ar";
  const { neighborhoods, city } = useLocationSelection(String(props.values.city || ""));
  return (
    <div className="flex flex-col gap-2">
      <SearchableSelect
        {...props}
        value={String(props.value || "")}
        disabled={!props.values.city}
        allowCustom
        options={(neighborhoods.data || []).map((item) => ({
          value: item.nameAr.trim() || item.nameEn.trim() || item.slug,
          label: locationLabel(item, locale),
          keywords: `${item.nameAr} ${item.nameEn}`,
        }))}
      />
      {city && neighborhoods.isPending ? (
        <p
          role="status"
          className="text-xs text-muted-foreground"
        >
          {ar ? "نحمّل الأحياء" : "Loading neighborhoods"}
        </p>
      ) : null}
      {neighborhoods.isError ? (
        <LocationCatalogFailure
          kind="neighborhoods"
          query={neighborhoods}
        />
      ) : null}
    </div>
  );
}
export function CoordinateField({
  longitudeName = "longitude",
  presets,
  ...props
}: FormFieldRenderProps & { longitudeName?: string; presets?: LocationPreset[] }) {
  const latitude = props.value;
  const longitude = props.values[longitudeName];
  return (
    <LocationPicker
      {...props}
      value={
        validCoordinates(latitude, longitude)
          ? { latitude: Number(latitude), longitude: Number(longitude) }
          : null
      }
      onChange={(point) => {
        props.onChange(point.latitude);
        props.setValue(longitudeName, point.longitude);
      }}
      presets={presets}
    />
  );
}
