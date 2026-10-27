
"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import {
  Check,
  CheckCheck,
  Heart,
  Search,
  Sparkles,
  X,
  RotateCcw,
  ArrowUpLeft,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Locale = "ar" | "en";

type Interest = {
  id: string;
  ar: string;
  en: string;
  icon: string;
};

type InterestCategory = {
  id: string;
  ar: string;
  en: string;
  descriptionAr: string;
  descriptionEn: string;
  icon: LucideIcon;
  interests: Interest[];
};

// بيانات مؤقتة للواجهة فقط.
// لاحقًا نستبدلها بالخيارات المعتمدة من المشروع.
const categories: InterestCategory[] = [
  {
    id: "daily",
    ar: "احتياجاتك اليومية",
    en: "Daily essentials",
    descriptionAr: "الخدمات اللي تحتاجها باستمرار",
    descriptionEn: "Services you use regularly",
    icon: Heart,
    interests: [
      { id: "supermarket", ar: "سوبرماركت", en: "Supermarkets", icon: "🛒" },
      { id: "pharmacy", ar: "صيدليات", en: "Pharmacies", icon: "💊" },
      { id: "hospital", ar: "مستشفيات", en: "Hospitals", icon: "🏥" },
      { id: "atm", ar: "صراف آلي", en: "ATMs", icon: "🏧" },
      { id: "gas_station", ar: "محطات وقود", en: "Gas stations", icon: "⛽" },
      { id: "laundry", ar: "مغاسل ملابس", en: "Laundries", icon: "🧺" },
    ],
  },
  {
    id: "lifestyle",
    ar: "أسلوب حياتك",
    en: "Lifestyle",
    descriptionAr: "الأماكن اللي تحب تقضي فيها وقتك",
    descriptionEn: "Places you enjoy spending time at",
    icon: Sparkles,
    interests: [
      { id: "cafe", ar: "مقاهي", en: "Cafés", icon: "☕" },
      { id: "restaurant", ar: "مطاعم", en: "Restaurants", icon: "🍽️" },
      { id: "gym", ar: "نوادي رياضية", en: "Gyms", icon: "🏋️" },
      { id: "park", ar: "حدائق", en: "Parks", icon: "🌳" },
      { id: "mall", ar: "مراكز تسوق", en: "Shopping malls", icon: "🛍️" },
      { id: "cinema", ar: "سينما", en: "Cinemas", icon: "🎬" },
    ],
  },
  {
    id: "family",
    ar: "العائلة والتعليم",
    en: "Family & education",
    descriptionAr: "خدمات تهمك وتهم أفراد عائلتك",
    descriptionEn: "Services for you and your family",
    icon: Heart,
    interests: [
      { id: "school", ar: "مدارس", en: "Schools", icon: "🏫" },
      { id: "kindergarten", ar: "رياض أطفال", en: "Kindergartens", icon: "🧸" },
      { id: "university", ar: "جامعات", en: "Universities", icon: "🎓" },
      { id: "playground", ar: "ملاعب أطفال", en: "Playgrounds", icon: "🛝" },
      { id: "library", ar: "مكتبات", en: "Libraries", icon: "📚" },
      { id: "clinic", ar: "عيادات", en: "Clinics", icon: "🩺" },
    ],
  },
];

export function InterestsPage() {
  const locale: Locale = useLocale() === "ar" ? "ar" : "en";
  const ar = locale === "ar";

  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState(false);

  const total = categories.reduce(
    (sum, category) => sum + category.interests.length,
    0,
  );

  const filteredCategories = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return categories;

    return categories
      .map((category) => ({
        ...category,
        interests: category.interests.filter((interest) =>
          [interest.ar, interest.en].some((label) =>
            label.toLowerCase().includes(term),
          ),
        ),
      }))
      .filter((category) => category.interests.length > 0);
  }, [search]);

  function toggleInterest(id: string) {
    setSaved(false);

    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function clearSelection() {
    setSelected([]);
    setSaved(false);
  }

  function selectAll() {
    setSelected(
      categories.flatMap((category) =>
        category.interests.map((interest) => interest.id),
      ),
    );
    setSaved(false);
  }

  function handleSave() {
    // UI only — سيتم ربطه بالـAPI لاحقًا.
    setSaved(true);
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      {/* Page header */}
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" />
            {ar ? "تجربة تناسب حياتك" : "Made for your lifestyle"}
          </div>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {ar ? "وش يهمك حول بيتك؟" : "What matters near your home?"}
          </h1>

          <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            {ar
              ? "اختر الأماكن والخدمات اللي تهمك، وخل مدار يساعدك تكتشف العقارات والأحياء الأقرب لأسلوب حياتك."
              : "Choose the places and services that matter to you, and let Madar help you discover neighborhoods that fit your lifestyle."}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3 rounded-2xl border bg-card px-5 py-3 shadow-sm">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CheckCheck className="size-5" />
          </div>
          <div>
            <div className="text-xl font-semibold tabular-nums">
              {selected.length}
              <span className="mx-1 text-sm font-normal text-muted-foreground">
                / {total}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {ar ? "اهتمامات مختارة" : "Selected interests"}
            </p>
          </div>
        </div>
      </div>

      {/* Main selection panel */}
      <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 border-b border-border/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">
              {ar ? "اختر اهتماماتك" : "Choose your interests"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {ar
                ? "تقدر تختار أكثر من اهتمام وتعدلها بأي وقت."
                : "Select as many as you like. You can change them anytime."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={selectAll}
              disabled={selected.length === total}
            >
              <CheckCheck className="size-4" />
              {ar ? "تحديد الكل" : "Select all"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              disabled={selected.length === 0}
            >
              <RotateCcw className="size-4" />
              {ar ? "مسح الاختيارات" : "Clear all"}
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="px-5 pt-5 sm:px-6">
          <div className="relative max-w-md">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground"
            />

            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={
                ar ? "ابحث عن اهتمام أو خدمة..." : "Search interests or services..."
              }
              aria-label={ar ? "البحث في الاهتمامات" : "Search interests"}
              className="h-11 rounded-xl bg-background ps-10 pe-10"
            />

            {search && (
              <button
                type="button"
                aria-label={ar ? "مسح البحث" : "Clear search"}
                onClick={() => setSearch("")}
                className="absolute top-1/2 end-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-9 p-5 sm:p-6">
          {filteredCategories.map((category) => {
            const CategoryIcon = category.icon;

            const categorySelected = category.interests.filter(
              (interest) => selected.includes(interest.id),
            ).length;

            return (
              <section key={category.id} className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                      <CategoryIcon className="size-5" />
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold sm:text-base">
                        {ar ? category.ar : category.en}
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {ar
                          ? category.descriptionAr
                          : category.descriptionEn}
                      </p>
                    </div>
                  </div>

                  {categorySelected > 0 && (
                    <Badge variant="secondary" className="shrink-0">
                      {categorySelected}{" "}
                      {ar ? "مختار" : "selected"}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                  {category.interests.map((interest) => {
                    const active = selected.includes(interest.id);

                    return (
                      <button
                        key={interest.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleInterest(interest.id)}
                        className={cn(
                          "group relative flex min-h-20 items-center gap-3 rounded-2xl border p-3.5 text-start transition-all duration-200",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          active
                            ? "border-primary bg-primary/5 shadow-sm dark:bg-primary/10"
                            : "border-border/70 bg-background hover:border-primary/40 hover:bg-muted/50",
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "flex size-10 shrink-0 items-center justify-center rounded-xl text-xl transition-colors",
                            active ? "bg-primary/10" : "bg-muted/70",
                          )}
                        >
                          {interest.icon}
                        </span>

                        <span className="min-w-0 flex-1 text-xs font-medium leading-5 sm:text-sm">
                          {ar ? interest.ar : interest.en}
                        </span>

                        <span
                          aria-hidden="true"
                          className={cn(
                            "absolute end-2.5 top-2.5 flex size-4 items-center justify-center rounded-full border transition-all",
                            active
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background",
                          )}
                        >
                          {active && <Check className="size-3" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {filteredCategories.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Search className="size-5 text-muted-foreground" />
              </div>

              <p className="text-sm font-medium">
                {ar ? "ما لقينا نتائج مطابقة" : "No matching interests"}
              </p>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearch("")}
              >
                {ar ? "مسح البحث" : "Clear search"}
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-4 border-t border-border/70 bg-muted/20 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-xl",
                selected.length
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <Heart className="size-5" />
            </div>

            <div>
              <p className="text-sm font-medium">
                {selected.length
                  ? ar
                    ? `اخترت ${selected.length} من اهتماماتك`
                    : `${selected.length} interests selected`
                  : ar
                    ? "ما اخترت اهتمامات للحين"
                    : "No interests selected yet"}
              </p>

              <p className="text-xs text-muted-foreground">
                {ar
                  ? "اختياراتك تساعد مدار يفهم أولوياتك."
                  : "Your choices help Madar understand your priorities."}
              </p>
            </div>
          </div>

          <Button
            type="button"
            size="lg"
            onClick={handleSave}
            disabled={selected.length === 0 || saved}
            className="w-full rounded-xl px-6 sm:w-auto"
          >
            {saved
              ? ar
                ? "تم تأكيد الاختيارات"
                : "Selection confirmed"
              : ar
                ? "تأكيد الاهتمامات"
                : "Confirm interests"}

            {saved ? (
              <Check className="size-4" />
            ) : (
              <ArrowUpLeft className="size-4" />
            )}
          </Button>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {ar
          ? "هذه نسخة تجريبية للواجهة. الاختيارات لا تُحفظ في الحساب حاليًا."
          : "This is a UI preview. Selections are not saved to your account yet."}
      </p>
    </main>
  );
}
