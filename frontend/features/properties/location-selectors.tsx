"use client";
// @refresh reset
import { useId, useMemo } from "react";
import { useLocale } from "next-intl";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import { locationLabel, isSearchNeighborhoodId } from "@/lib/api/locations";
import { ApiError } from "@/lib/api/errors";
import { useLocationTranslations } from "./use-location-translations";
import { normalizeLocationName } from "@/lib/locations/normalize-name";
import { useCities, useLocationSelection, useCatalogRetry } from "./location-hooks";

type CatalogQuery = { error: unknown; errorUpdatedAt: number; isFetching: boolean; refetch: () => Promise<unknown> };
export function LocationCatalogFailure({ query, kind = "cities" }: { query: CatalogQuery; kind?: "cities" | "neighborhoods" }) {
  const t = useLocationTranslations();
  const retry = useCatalogRetry(query);
  const status = query.error instanceof ApiError ? query.error.status : undefined;
  const providerRejectedCity = query.error instanceof ApiError && query.error.backendMessage === "Location provider rejected the city identifier";
  const key = status === 429 ? "rateLimited"
    : kind === "cities" && status === 400 ? "catalogRejected"
    : kind === "cities" && status === 404 ? "catalogUnavailable"
    : kind === "neighborhoods" && (status === 404 || providerRejectedCity) ? "cityRejected"
    : kind === "neighborhoods" && status === 400 ? "neighborhoodRequestFailed"
    : status === 502 || status === 503 ? "providerUnavailable" : "requestFailed";
  return <div role="alert" className="flex flex-col items-start gap-2 text-sm"><p>{t(key)}</p><Button type="button" variant="outline" size="sm" disabled={retry.disabled} onClick={retry.retry}>{retry.coolingDown ? t("retryWait") : query.isFetching ? t("refreshing") : status === 404 && kind === "neighborhoods" ? t("refreshCities") : t("retry")}</Button></div>;
}

type Option = { value: string; nameAr: string; nameEn: string; slug: string; disabled?: boolean };
function LocationCombobox({ id, options, value, onChange, placeholder, disabled, invalid, describedBy, required }: {
  id: string; options: Option[]; value: string; onChange: (value: string) => void; placeholder: string; disabled?: boolean; invalid?: boolean; describedBy: string; required?: boolean;
}) {
  const locale = useLocale();
  const t = useLocationTranslations();
  const direction = locale === "ar" ? "rtl" : "ltr";
  const sorted = useMemo(() => {
    const collator = new Intl.Collator(locale, { sensitivity: "base", numeric: true });
    return [...options].sort((a, b) => collator.compare(locationLabel(a, locale), locationLabel(b, locale)));
  }, [options, locale]);
  const selected = sorted.find(item => item.value === value) || null;
  return <DirectionProvider direction={direction}><Combobox items={sorted} value={selected} onValueChange={(item: Option | null) => onChange(item?.value || "")} disabled={disabled} itemToStringLabel={(item: Option) => locationLabel(item, locale)} itemToStringValue={(item: Option) => item.value} isItemEqualToValue={(a: Option,b: Option) => a.value === b.value} filter={(item: Option, term: string) => [item.nameAr, item.nameEn, item.slug].some(name => normalizeLocationName(name).includes(normalizeLocationName(term)))}>
    <ComboboxInput id={id} dir={direction} placeholder={placeholder} aria-label={placeholder} aria-required={required} aria-invalid={invalid} aria-describedby={describedBy} />
    <ComboboxContent dir={direction}><ComboboxEmpty className="p-4 text-center text-sm text-muted-foreground">{t("noMatch")}</ComboboxEmpty><ComboboxList>{(item: Option) => <ComboboxItem key={item.value} value={item} disabled={item.disabled}><span className="flex min-w-0 flex-col gap-1"><span className="break-words">{locationLabel(item, locale)}</span>{item.disabled ? <span className="text-xs text-muted-foreground">{t("unsupportedId")}</span> : null}</span></ComboboxItem>}</ComboboxList></ComboboxContent>
  </Combobox></DirectionProvider>;
}

export function CitySelector({ value, onChange, error }: { value: string; onChange: (value: string) => void; error?: string }) {
  const t = useLocationTranslations(); const id = useId();
  const cities = useCities();
  const options = useMemo(() => (cities.data || []).map(city => ({ ...city, value: city.slug })), [cities.data]);
  const unavailable = cities.hydrated && !!cities.data && !!value && !cities.data.some(city => city.slug === value);
  return <Field data-invalid={!!error || unavailable}><FieldLabel htmlFor={id}>{t("cityLabel")} <span aria-hidden="true">*</span></FieldLabel>
    {!cities.hydrated || cities.isPending ? <div role="status"><Skeleton className="h-11 w-full rounded-xl" /><span className="sr-only">{t("loadingCities")}</span></div> : cities.isError && !cities.data ? <LocationCatalogFailure query={cities} /> : !options.length ? <p role="status" className="text-sm text-muted-foreground">{t("emptyCities")}</p> : <LocationCombobox id={id} options={options} value={value} onChange={onChange} placeholder={t("cityPlaceholder")} required invalid={!!error || unavailable} describedBy={`${id}-help`} />}
    {cities.hydrated && cities.isError && cities.data ? <><p role="status" className="text-xs text-muted-foreground">{t("cachedCities")}</p><LocationCatalogFailure query={cities} /></> : null}
    <FieldDescription id={`${id}-help`} aria-live="polite">{error || (unavailable ? t("cityUnavailable") : t("cityHelp"))}</FieldDescription>
  </Field>;
}

export function NeighborhoodSelector({ city, value, onChange, error }: { city: string; value: string; onChange: (value: string) => void; error?: string }) {
  const t = useLocationTranslations(); const id = useId();
  const selection = useLocationSelection(city, value);
  const query = selection.neighborhoods;
  const options = useMemo(() => (query.data || []).map(item => ({ ...item, value: String(item.id), disabled: !isSearchNeighborhoodId(String(item.id)) })), [query.data]);
  const unavailable = !!value && !!selection.city && !!query.data && !selection.neighborhood;
  const retry = { ...query, refetch: async () => {
    if (query.error instanceof ApiError && query.error.status === 404) {
      const refreshed = await selection.cities.refetch();
      if (refreshed.isError || !refreshed.data?.some(item => item.slug === city)) return;
    }
    await query.refetch();
  } };
  return <Field data-invalid={!!error || unavailable}><FieldLabel htmlFor={id}>{t("neighborhoodLabel")}</FieldLabel>
    {!selection.city ? <LocationCombobox id={id} options={[]} value="" onChange={onChange} placeholder={t("chooseCityFirst")} disabled describedBy={`${id}-help`} /> : query.isPending ? <div role="status"><Skeleton className="h-11 w-full rounded-xl" /><span className="sr-only">{t("loadingNeighborhoods")}</span></div> : query.isError && !query.data ? <LocationCatalogFailure query={retry} kind="neighborhoods" /> : !options.length ? <p role="status" className="text-sm text-muted-foreground">{t("emptyNeighborhoods")}</p> : <LocationCombobox key={city} id={id} options={options} value={value} onChange={onChange} placeholder={t("neighborhoodPlaceholder")} invalid={!!error || unavailable} describedBy={`${id}-help`} />}
    {query.isError && query.data ? <><p role="status" className="text-xs text-muted-foreground">{t("cachedNeighborhoods")}</p><LocationCatalogFailure query={retry} kind="neighborhoods" /></> : null}
    <FieldDescription id={`${id}-help`} aria-live="polite">{error || (unavailable ? t("neighborhoodUnavailable") : selection.city ? t("neighborhoodHelp") : t("chooseCityFirst"))}</FieldDescription>
    {value ? <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => onChange("")}>{t("clearNeighborhood")}</Button> : null}
  </Field>;
}
