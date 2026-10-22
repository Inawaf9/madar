"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supportedSearchCity, type RegionId } from "@/lib/property-regions";
import { CitySelector, RegionSelector } from "./region-city-selector";
import { searchSchema, propertyTypes, sorts, serializeQuery } from "@/lib/api/discovery-contracts";

const labels: Record<string, string> = { purpose: "الغرض", q: "كلمة البحث", type: "نوع العقار", neighborhoodId: "رقم الحي لدى المزوّد", minPrice: "أقل سعر — ر.س", maxPrice: "أعلى سعر — ر.س", minArea: "أقل مساحة — م²", maxArea: "أعلى مساحة — م²", minBedrooms: "أقل عدد غرف النوم", minBathrooms: "أقل عدد الحمامات", furnished: "التأثيث", rentFrequency: "دورية الإعلان الإيجاري", sort: "الترتيب", limit: "عدد النتائج في الدفعة" };
const types: Record<string, string> = { all: "جميع الأنواع", apartment: "شقة", villa: "فيلا", floor: "دور", duplex: "دوبلكس", building: "عمارة", office: "مكتب", shop: "محل", warehouse: "مستودع", land: "أرض" };
const sortLabels = ["الأحدث", "آخر تحديث", "الأقدم تحديثًا", "السعر: الأقل", "السعر: الأعلى", "انخفاض السعر", "الأطول عرضًا", "ترتيب المزوّد", "السعر: الأقل", "السعر: الأعلى", "انخفاض السعر"];
export function SearchForm({ initial, compact = false }: { initial: Record<string, string>; compact?: boolean }) {
  const router = useRouter();
  const initialCity = supportedSearchCity(initial.city);
  const [region, setRegion] = useState<RegionId | null>(initialCity?.regionId || null);
  const [draft, setDraft] = useState<Record<string, string>>({ purpose: "rent", type: "all", sort: "newest", limit: "20", ...initial, city: initialCity?.apiSlug || "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (key: string, value: string) => { setDraft(old => ({ ...old, [key]: value, cursor: "", ...(key === "city" ? { neighborhoodId: "" } : {}), ...(key === "purpose" && value === "sale" ? { rentFrequency: "" } : {}) })); setErrors({}); };
  const changeRegion = (next: RegionId | null) => {
    setRegion(next);
    if (!next || supportedSearchCity(draft.city)?.regionId !== next) set("city", "");
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!region || supportedSearchCity(draft.city)?.regionId !== region) { setErrors({ city: "اختر منطقة ومدينة من القائمة لبدء البحث." }); return; }
    const input = Object.fromEntries(Object.entries(draft).filter(([key, value]) => value !== "" && key !== "cursor"));
    const parsed = searchSchema.safeParse(input);
    if (!parsed.success) { setErrors(Object.fromEntries(parsed.error.issues.map(issue => [String(issue.path[0]), issue.message.includes("ال") ? issue.message : "تحقق من القيمة وحدودها المطلوبة"]))); return; }
    router.push(`/properties?${serializeQuery(parsed.data)}`);
  };
  const control = (key: string, options?: { value: string; label: string }[]) => <Field key={key} data-invalid={!!errors[key]}>
    <FieldLabel htmlFor={`search-${key}`}>{labels[key]}</FieldLabel>
    {options ? <Select name={key} value={draft[key] || ""} items={options} onValueChange={value => set(key, value || "")}>
      <SelectTrigger id={`search-${key}`} className="w-full" aria-invalid={!!errors[key]}><SelectValue /></SelectTrigger>
      <SelectContent align="start" alignItemWithTrigger={false}><SelectGroup>{options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectGroup></SelectContent>
    </Select> : <Input id={`search-${key}`} name={key} value={draft[key] || ""} onChange={e => set(key, e.target.value)} aria-invalid={!!errors[key]} dir={key === "q" ? "auto" : "ltr"} type={key === "q" ? "text" : "number"} step={["minArea", "maxArea"].includes(key) ? "any" : "1"} />}
    {errors[key] ? <p role="alert" className="text-xs text-destructive">{errors[key]}</p> : null}
  </Field>;
  return <form onSubmit={submit} className="flex min-w-0 flex-col gap-4 rounded-3xl border bg-card p-4 shadow-stone sm:p-6">
    <RegionSelector value={region} onChange={changeRegion} />
    {initial.city && !initialCity ? <p className="text-xs leading-6 text-muted-foreground">مدينة الرابط ليست ضمن القائمة الموثّقة. اختر منطقة ومدينة لإجراء بحث جديد؛ يبقى بحث الرابط خاضعًا لتحقق المزوّد.</p> : null}
    <FieldGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <CitySelector regionId={region} value={draft.city} onChange={value => set("city", value)} error={errors.city} />{control("purpose", [{ value: "rent", label: "إيجار" }, { value: "sale", label: "شراء" }])}{control("q")}
      {control("type", propertyTypes.map(value => ({ value, label: types[value] })))}{control("minPrice")}{control("maxPrice")}
    </FieldGroup>
    <p className="text-xs leading-6 text-muted-foreground">البحث في مدينة واحدة. ميزانية الإيجار سنوية حتى عند اختيار إعلان شهري.</p>
    <details open={Object.keys(initial).some(key => ["neighborhoodId", "minArea", "maxArea", "minBedrooms", "minBathrooms", "furnished", "rentFrequency"].includes(key))}>
      <summary className="cursor-pointer py-2 text-sm font-bold">خيارات البحث المتقدمة</summary>
      <FieldGroup className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {["neighborhoodId", "minArea", "maxArea", "minBedrooms", "minBathrooms"].map(key => control(key))}
        {control("furnished", [{ value: "", label: "أي حالة" }, { value: "true", label: "مفروش" }, { value: "false", label: "غير مفروش" }])}
        {draft.purpose === "rent" ? control("rentFrequency", [{ value: "", label: "أي دورية" }, { value: "monthly", label: "شهري" }, { value: "yearly", label: "سنوي" }]) : null}
        {control("sort", sorts.map((value, i) => ({ value, label: sortLabels[i] })))}{control("limit")}
      </FieldGroup>
      <p className="mt-3 text-xs text-muted-foreground">رقم الحي اختياري ويجب أن يكون معرّفًا معروفًا لدى المزوّد؛ لا تتوفر قائمة أحياء في الخدمة الحالية.</p>
    </details>
    <div className="flex flex-wrap gap-3 border-t pt-4"><Button type="submit" size="lg" disabled={!region || supportedSearchCity(draft.city)?.regionId !== region}>{compact ? "استكشف العقارات" : "ابحث"}</Button><Button type="button" variant="outline" size="lg" onClick={() => { setRegion(null); setDraft({ city: "", purpose: "rent", type: "all", sort: "newest", limit: "20" }); setErrors({}); router.push("/properties"); }}>مسح الفلاتر</Button></div>
  </form>;
}
