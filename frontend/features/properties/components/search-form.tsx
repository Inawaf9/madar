"use client";
// @refresh reset
// Restore form state from the URL after hot updates to the location-selection hooks.
import { useLocale } from "next-intl";
import { useLocationTranslations } from "@/features/locations/use-location-translations";
import { apiLanguage } from "@/lib/api/config";
import { useState, type FormEvent } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { useLocationSelection } from "@/features/locations/location-hooks";
import {
  CitySelector,
  NeighborhoodSelector,
} from "@/features/locations/location-selectors";
import {
  searchSchema,
  searchKeys,
  propertyTypes,
  sorts,
} from "@/lib/api/discovery-contracts";
import { serializeQuery } from "@/lib/api/query";
import { searchDefaults, searchSnapshot, searchStateKey } from "../preference-search";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { SearchField } from "./search-field";

const labels: Record<string, string> = {
  purpose: "نوع الإعلان",
  q: "كلمة بحث أو اسم حي",
  type: "نوع العقار",
  minPrice: "أقل سعر (ر.س)",
  maxPrice: "أعلى سعر (ر.س)",
  minArea: "أقل مساحة (م²)",
  maxArea: "أعلى مساحة (م²)",
  minBedrooms: "أقل عدد غرف النوم",
  minBathrooms: "أقل عدد الحمامات",
  furnished: "التأثيث",
  rentFrequency: "فترة الإيجار",
  sort: "الترتيب",
  limit: "عدد النتائج في الدفعة",
};
const types: Record<string, string> = {
  all: "جميع الأنواع",
  apartment: "شقة",
  villa: "فيلا",
  floor: "دور",
  duplex: "دوبلكس",
  building: "عمارة",
  office: "مكتب",
  shop: "محل",
  warehouse: "مستودع",
  land: "أرض",
};
const sortLabels = [
  "الأحدث",
  "آخر تحديث",
  "الأقدم تحديثًا",
  "السعر: الأقل",
  "السعر: الأعلى",
  "انخفاض السعر",
  "الأطول عرضًا",
  "ترتيب المصدر",
  "السعر: الأقل",
  "السعر: الأعلى",
  "انخفاض السعر",
];
const advancedKeys = [
  "minArea",
  "maxArea",
  "minBedrooms",
  "minBathrooms",
  "furnished",
  "rentFrequency",
  "sort",
  "limit",
];
export function SearchForm({
  initial,
  compact = false,
  onInteraction,
  initialQuery,
}: {
  initial: Record<string, string>;
  compact?: boolean;
  onInteraction?: () => void;
  initialQuery?: string;
}) {
  const router = useRouter();
  const sourceParams = () => new URLSearchParams(initialQuery ?? initial);
  const locale = useLocale();
  const ar = locale === "ar";
  const language = apiLanguage(locale);
  const fieldLabels: Record<string, string> = ar
    ? labels
    : {
        city: "City",
        neighborhoodId: "Neighborhood",
        purpose: "Listing type",
        q: "Keyword or neighborhood",
        type: "Property type",
        minPrice: "Minimum price (SAR)",
        maxPrice: "Maximum price (SAR)",
        minArea: "Minimum area (m²)",
        maxArea: "Maximum area (m²)",
        minBedrooms: "Minimum bedrooms",
        minBathrooms: "Minimum bathrooms",
        furnished: "Furnishing",
        rentFrequency: "Rental period",
        sort: "Sort",
        limit: "Results per page",
      };
  const typeLabel = (value: string) =>
    ar
      ? types[value] || value
      : value === "all"
        ? "All types"
        : value.charAt(0).toUpperCase() + value.slice(1);
  const sortNames = ar
    ? sortLabels
    : [
        "Newest",
        "Recently updated",
        "Oldest update",
        "Price: low to high",
        "Price: high to low",
        "Price drop",
        "Longest on market",
        "Source order",
        "Price: low to high",
        "Price: high to low",
        "Price drop",
      ];
  const t = useLocationTranslations();
  const [draft, setDraft] = useState<Record<string, string>>(() => ({
    ...searchDefaults,
    ...Object.fromEntries(
      Object.entries(initial).filter(([key]) => !["region", "cityId"].includes(key)),
    ),
    city: initial.city || "",
  }));
  const location = useLocationSelection(draft.city, draft.neighborhoodId);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [advancedOpen, setAdvancedOpen] = useState(
    Object.keys(initial).some(
      (key) => advancedKeys.includes(key) && !["sort", "limit"].includes(key),
    ),
  );
  const set = (key: string, value: string) => {
    onInteraction?.();
    setDraft((old) => ({
      ...old,
      [key]: value,
      [searchStateKey]: "manual",
      preferenceNotice: "",
      cursor: "",
      ...(key === "city" ? { neighborhoodId: "" } : {}),
      ...(key === "purpose" && value === "sale" ? { rentFrequency: "" } : {}),
    }));
    setErrors({});
  };
  // Keep draft provider identifiers shareable without running a search until submit.
  // locationDraft is UI-only; legacy geography parameters are never forwarded.
  const syncLocation = (nextDraft: Record<string, string>) => {
    const params = sourceParams();
    [
      ...searchKeys,
      "cityId",
      "region",
      "cursor",
      "locationDraft",
      "preferenceNotice",
    ].forEach((key) => params.delete(key));
    for (const key of searchKeys)
      if (key !== "cursor" && nextDraft[key]) params.set(key, nextDraft[key]);
    params.set("locationDraft", "1");
    params.set(searchStateKey, "manual");
    params.delete("preferenceNotice");
    window.history.pushState(
      null,
      "",
      `${window.location.pathname}?${params}${window.location.hash}`,
    );
  };
  const changeCity = (city: string) => {
    if (typeof city !== "string" || city === draft.city) return;
    onInteraction?.();
    const nextDraft = {
      ...draft,
      [searchStateKey]: "manual",
      preferenceNotice: "",
      city,
      neighborhoodId: "",
      cursor: "",
    };
    setDraft(nextDraft);
    setErrors({});
    syncLocation(nextDraft);
  };
  const changeNeighborhood = (neighborhoodId: string) => {
    if (neighborhoodId === (draft.neighborhoodId || "")) return;
    onInteraction?.();
    const nextDraft = {
      ...draft,
      [searchStateKey]: "manual",
      preferenceNotice: "",
      neighborhoodId,
      cursor: "",
    };
    setDraft(nextDraft);
    setErrors({});
    syncLocation(nextDraft);
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onInteraction?.();
    if (!location.ready) {
      setErrors({
        [location.city ? "neighborhoodId" : "city"]: t(
          location.city ? "neighborhoodUnavailable" : "cityRequired",
        ),
      });
      return;
    }
    const input = Object.fromEntries(
      Object.entries(draft).filter(([key, value]) => value !== "" && key !== "cursor"),
    );
    const parsed = searchSchema.safeParse({ ...input, lang: language });
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [
            String(issue.path[0]),
            issue.message.includes("ال")
              ? issue.message
              : ar
                ? "راجع القيمة والحدود المسموحة"
                : "Check the value and allowed range",
          ]),
        ),
      );
      if (
        parsed.error.issues.some((issue) => advancedKeys.includes(String(issue.path[0])))
      )
        setAdvancedOpen(true);
      return;
    }
    const params = sourceParams();
    [...searchKeys, "region", "cityId", "locationDraft", "preferenceNotice"].forEach(
      (key) => params.delete(key),
    );
    new URLSearchParams(serializeQuery(parsed.data)).forEach((value, key) =>
      params.set(key, value),
    );
    params.set(searchStateKey, "manual");
    router.push(`/properties?${params}`);
  };
  const control = (key: string, options?: { value: string; label: string }[]) => (
    <SearchField
      key={key}
      fieldKey={key}
      options={options}
      errors={errors}
      draft={draft}
      fieldLabels={fieldLabels}
      arabic={ar}
      onChange={set}
    />
  );
  const activeKeys = [
    "city",
    "neighborhoodId",
    "purpose",
    "type",
    "minPrice",
    "maxPrice",
    "q",
    "minArea",
    "maxArea",
    "minBedrooms",
    "minBathrooms",
    "furnished",
    "rentFrequency",
  ].filter(
    (key) =>
      draft[key] &&
      !(key === "type" && draft[key] === "all") &&
      !(key === "purpose" && draft[key] === "rent"),
  );
  const activeValue = (key: string) => {
    if (key === "city")
      return location.city
        ? (ar ? location.city.nameAr : location.city.nameEn) || location.city.slug
        : draft.city;
    if (key === "neighborhoodId")
      return location.neighborhood
        ? (ar ? location.neighborhood.nameAr : location.neighborhood.nameEn) ||
            location.neighborhood.slug
        : draft[key];
    if (key === "type") return typeLabel(draft[key]);
    if (key === "purpose")
      return draft[key] === "sale" ? (ar ? "شراء" : "Buy") : ar ? "إيجار" : "Rent";
    if (key === "furnished")
      return draft[key] === "true"
        ? ar
          ? "مفروش"
          : "Furnished"
        : ar
          ? "غير مفروش"
          : "Unfurnished";
    if (key === "rentFrequency")
      return draft[key] === "monthly"
        ? ar
          ? "شهري"
          : "Monthly"
        : ar
          ? "سنوي"
          : "Yearly";
    return draft[key];
  };
  const removeFilter = (key: string) => {
    onInteraction?.();
    const nextDraft = {
      ...draft,
      [key]: key === "type" ? "all" : key === "purpose" ? "rent" : "",
      [searchStateKey]: "manual",
      preferenceNotice: "",
      cursor: "",
      ...(key === "city" ? { neighborhoodId: "" } : {}),
      ...(key === "purpose" ? { rentFrequency: "" } : {}),
    };
    setDraft(nextDraft);
    setErrors({});
    syncLocation(nextDraft);
  };
  const clearAllFilters = () => {
    onInteraction?.();
    setDraft({ ...searchDefaults, city: "", [searchStateKey]: "manual" });
    setErrors({});
    const params = searchSnapshot(sourceParams(), {}, "manual");
    router.push(`/properties?${params}`);
  };
  return (
    <form
      onSubmit={submit}
      className="flex min-w-0 flex-col gap-5 rounded-3xl border bg-card p-4 shadow-stone sm:p-6"
    >
      {activeKeys.length ? (
        <div
          className="flex min-w-0 flex-wrap gap-2"
          aria-label={ar ? "الفلاتر المختارة" : "Selected filters"}
        >
          {activeKeys.map((key) => (
            <Button
              key={key}
              type="button"
              variant="secondary"
              size="sm"
              className="h-auto min-h-9 max-w-full rounded-full py-2 text-start whitespace-normal"
              onClick={() => removeFilter(key)}
              aria-label={`${ar ? "مسح" : "Clear"} ${fieldLabels[key] || (key === "city" ? (ar ? "المدينة" : "City") : ar ? "الحي" : "Neighborhood")}`}
            >
              <span className="min-w-0 wrap-break-word">
                {fieldLabels[key] ||
                  (key === "city"
                    ? ar
                      ? "المدينة"
                      : "City"
                    : ar
                      ? "الحي"
                      : "Neighborhood")}
                : {activeValue(key)}
              </span>
              <X
                data-icon="inline-end"
                className="shrink-0"
              />
            </Button>
          ))}
        </div>
      ) : null}
      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        <CitySelector
          value={draft.city}
          onChange={changeCity}
          error={errors.city}
        />
        <NeighborhoodSelector
          city={draft.city}
          value={draft.neighborhoodId || ""}
          onChange={changeNeighborhood}
          error={errors.neighborhoodId}
        />
      </FieldGroup>
      <FieldGroup className="grid gap-4 border-t pt-5 sm:grid-cols-2 lg:grid-cols-4">
        {control("purpose", [
          { value: "rent", label: ar ? "إيجار" : "Rent" },
          { value: "sale", label: ar ? "شراء" : "Buy" },
        ])}
        {control(
          "type",
          propertyTypes.map((value) => ({ value, label: typeLabel(value) })),
        )}
        {control("minPrice")}
        {control("maxPrice")}
      </FieldGroup>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">{control("q")}</div>
        <Button
          type="submit"
          className="sm:min-w-36"
          disabled={!location.ready}
        >
          <Search data-icon="inline-start" />
          {ar
            ? compact
              ? "استكشف العقارات"
              : "ابحث عن عقار"
            : compact
              ? "Explore properties"
              : "Search properties"}
        </Button>
      </div>
      <p className="-mt-2 text-xs leading-6 text-muted-foreground">
        {ar
          ? "ابحث في مدينة واحدة. ميزانية الإيجار سنوية حتى لو كان الإعلان شهريًا."
          : "Search one city at a time. Rental budgets are annual, even for monthly listings."}
      </p>
      <details
        className="group border-t pt-1"
        open={advancedOpen}
        onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}
      >
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg py-3 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
          <SlidersHorizontal
            aria-hidden="true"
            className="size-4"
          />
          {ar ? "بحث متقدم" : "Advanced search"}
          <ChevronDown
            aria-hidden="true"
            className="ms-auto size-4 transition-transform group-open:rotate-180 motion-reduce:transition-none"
          />
        </summary>
        <FieldGroup className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {["minArea", "maxArea", "minBedrooms", "minBathrooms"].map((key) =>
            control(key),
          )}
          {control("furnished", [
            { value: "", label: ar ? "أي حالة" : "Any" },
            { value: "true", label: ar ? "مفروش" : "Furnished" },
            { value: "false", label: ar ? "غير مفروش" : "Unfurnished" },
          ])}
          {draft.purpose === "rent"
            ? control("rentFrequency", [
                { value: "", label: ar ? "أي دورية" : "Any frequency" },
                { value: "monthly", label: ar ? "شهري" : "Monthly" },
                { value: "yearly", label: ar ? "سنوي" : "Yearly" },
              ])
            : null}
          {control(
            "sort",
            sorts.map((value, i) => ({ value, label: sortNames[i] })),
          )}
          {control("limit")}
        </FieldGroup>
      </details>
      <div className="flex justify-end border-t pt-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
        >
          {ar ? "مسح جميع الفلاتر" : "Clear all filters"}
        </Button>
      </div>
    </form>
  );
}
