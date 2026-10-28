
"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft, Check, LoaderCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api/client";
import { credits } from "@/lib/api/credits";
import { discovery } from "@/lib/api/discovery";
import { useCurrentUserId } from "@/features/account/session-hooks";

type SearchProperty =
    Awaited<ReturnType<typeof discovery.search>>["data"][number];

type ComparedProperty = {
    externalPropertyId: string;
    source: string;
    title: string | null;
    neighborhood: string | null;
    price: number | null;
    bedrooms: number | null;
    areaSqm: number | null;
    matchScore: number | null;
    housingScore: number | null;
    commuteScore: number | null;
    servicesScore: number | null;
};

type ComparisonResult = {
    properties: ComparedProperty[];
    aiAnalysis: {
        recommendedExternalPropertyId: string | null;
        recommendedPropertyTitle: string | null;
        reason: string | null;
        alternativeReason: string | null;
        tradeOff: string | null;
    } | null;
};

type Props = {
    first: SearchProperty | null;
    properties: SearchProperty[];
    onClose: () => void;
};

export function CompareSearchDialog({
                                        first,
                                        properties,
                                        onClose,
                                    }: Props) {
    const locale = useLocale();
    const ar = locale === "ar";
    const userId = useCurrentUserId();
    const cache = useQueryClient();

    const [second, setSecond] = useState<SearchProperty | null>(null);
    const [confirming, setConfirming] = useState(false);

    const prices = useQuery({
        queryKey: ["credit-service-prices", userId],
        queryFn: ({ signal }) => credits.servicePrices(signal),
        enabled: !!first && userId !== null,
    });

    const balance = useQuery({
        queryKey: ["credit-balance", userId],
        queryFn: ({ signal }) => credits.balance(signal),
        enabled: !!first && userId !== null,
    });

    const cost = prices.data?.AI_COMPARISON;
    const insufficient =
        cost != null &&
        balance.data != null &&
        balance.data.balance < cost;

    const comparison = useMutation({
        mutationFn: async () => {
            if (!first || !second) throw new Error("Select two properties");

            const path = [
                "/api/v1/property-comparison/me/compare-two",
                encodeURIComponent(first.source),
                encodeURIComponent(String(first.externalId)),
                encodeURIComponent(second.source),
                encodeURIComponent(String(second.externalId)),
            ].join("/");

            return apiRequest<ComparisonResult>(path, {
                headers: { "Accept-Language": ar ? "ar" : "en" },
            });
        },
        retry: 0,
        onSettled: async () => {
            await Promise.all([
                cache.invalidateQueries({
                    queryKey: ["credit-balance", userId],
                }),
                cache.invalidateQueries({
                    queryKey: ["credit-transactions", userId],
                }),
            ]);
        },
    });

    if (!first) return null;

    const alternatives = properties.filter(
        (p) =>
            p.externalId &&
            !(p.source === first.source && p.externalId === first.externalId),
    );

    const money = (value: number | null | undefined) =>
        value == null
            ? "—"
            : new Intl.NumberFormat(locale).format(value);

    const close = () => {
        if (!comparison.isPending) {
            setSecond(null);
            setConfirming(false);
            comparison.reset();
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-3 backdrop-blur-[3px] sm:p-6"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) close();
            }}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-label={ar ? "مقارنة العقارات" : "Compare properties"}
                dir={ar ? "rtl" : "ltr"}
                className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[26px] border border-border bg-background shadow-2xl"
            >
                <header className="flex items-start justify-between gap-4 border-b border-border/60 px-5 py-5 sm:px-7">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-primary">
                            <ArrowRightLeft className="size-4" />
                            <span className="text-xs font-medium">
                {ar ? "مقارنة العقارات" : "Property comparison"}
              </span>
                        </div>
                        <h2 className="text-xl font-semibold">
                            {ar ? "قارن مع عقار آخر" : "Compare with another property"}
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {ar
                                ? "اختر عقارًا ثانيًا من نتائج البحث الحالية."
                                : "Choose another property from your current results."}
                        </p>
                    </div>

                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={close}
                        disabled={comparison.isPending}
                        aria-label={ar ? "إغلاق" : "Close"}
                    >
                        <X className="size-5" />
                    </Button>
                </header>

                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-7">
                    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                        <p className="mb-1 text-xs text-muted-foreground">
                            {ar ? "العقار الأول" : "First property"}
                        </p>
                        <p className="font-semibold">
                            {first.title || (ar ? "عقار مختار" : "Selected property")}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {money(first.price)} {ar ? "ر.س" : "SAR"}
                        </p>
                    </div>

                    {!comparison.data && (
                        <>
                            <h3 className="text-sm font-semibold">
                                {ar ? "اختر العقار الثاني" : "Choose the second property"}
                            </h3>

                            <div className="grid gap-3 sm:grid-cols-2">
                                {alternatives.map((property) => {
                                    const selected =
                                        second?.source === property.source &&
                                        second?.externalId === property.externalId;

                                    return (
                                        <button
                                            type="button"
                                            key={`${property.source}:${property.externalId}`}
                                            onClick={() => {
                                                setSecond(property);
                                                setConfirming(false);
                                                comparison.reset();
                                            }}
                                            className={`flex min-w-0 items-start justify-between gap-3 rounded-2xl border p-4 text-start transition-colors ${
                                                selected
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border/70 bg-card hover:border-primary/40"
                                            }`}
                                        >
                                            <div className="min-w-0">
                                                <p className="line-clamp-2 text-sm font-semibold">
                                                    {property.title ||
                                                        (ar ? "عقار بدون عنوان" : "Untitled property")}
                                                </p>
                                                <p className="mt-2 text-sm text-muted-foreground">
                                                    {money(property.price)} {ar ? "ر.س" : "SAR"}
                                                </p>
                                            </div>
                                            {selected && (
                                                <Check className="size-5 shrink-0 text-primary" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {alternatives.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    {ar
                                        ? "ما فيه عقار ثانٍ ضمن النتائج المحمّلة. حمّلي المزيد من النتائج أولًا."
                                        : "No other loaded property. Load more search results first."}
                                </p>
                            )}

                            {second && (
                                <div className="space-y-4 rounded-2xl border border-border/70 bg-secondary/20 p-4">
                                    <div className="flex flex-wrap justify-between gap-2 text-sm">
                    <span>
                      {ar ? "تكلفة المقارنة الذكية" : "AI comparison cost"}
                    </span>
                                        <strong>
                                            {cost == null ? "—" : money(cost)}{" "}
                                            {ar ? "كريدت" : "credits"}
                                        </strong>
                                    </div>

                                    <p className="text-xs text-muted-foreground">
                                        {ar ? "رصيدك الحالي:" : "Current balance:"}{" "}
                                        {money(balance.data?.balance)}
                                    </p>

                                    {insufficient && (
                                        <p className="text-sm text-destructive">
                                            {ar
                                                ? "رصيدك غير كافٍ لإجراء المقارنة."
                                                : "Insufficient credits for this comparison."}
                                        </p>
                                    )}

                                    {!confirming ? (
                                        <Button
                                            className="w-full"
                                            disabled={
                                                cost == null ||
                                                balance.data == null ||
                                                insufficient ||
                                                prices.isError ||
                                                balance.isError
                                            }
                                            onClick={() => setConfirming(true)}
                                        >
                                            {ar ? "متابعة إلى التأكيد" : "Continue to confirmation"}
                                        </Button>
                                    ) : (
                                        <div className="space-y-3">
                                            <p className="text-sm">
                                                {ar
                                                    ? `هل تؤكدين إجراء المقارنة مقابل ${money(cost)} كريدت؟`
                                                    : `Confirm comparison for ${money(cost)} credits?`}
                                            </p>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setConfirming(false)}
                                                    disabled={comparison.isPending}
                                                >
                                                    {ar ? "إلغاء" : "Cancel"}
                                                </Button>
                                                <Button
                                                    disabled={comparison.isPending || insufficient}
                                                    onClick={() => {
                                                        setConfirming(false);
                                                        comparison.mutate();
                                                    }}
                                                >
                                                    {ar ? "تأكيد المقارنة" : "Confirm comparison"}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {comparison.isPending && (
                        <div role="status" className="flex items-center gap-3 py-6">
                            <LoaderCircle className="size-5 animate-spin text-primary" />
                            <p className="text-sm">
                                {ar
                                    ? "جاري تحليل العقارين..."
                                    : "Analyzing both properties..."}
                            </p>
                        </div>
                    )}

                    {comparison.isError && (
                        <div role="alert" className="rounded-xl border border-destructive/30 p-4">
                            <p className="text-sm text-destructive">
                                {ar
                                    ? "تعذرت المقارنة حاليًا. قد تكون إحدى الخدمات الخارجية غير متاحة."
                                    : "Comparison failed. An external service may be unavailable."}
                            </p>
                        </div>
                    )}

                    {comparison.data && (
                        <div className="space-y-5">
                            <h3 className="text-lg font-semibold">
                                {ar ? "نتيجة المقارنة" : "Comparison result"}
                            </h3>

                            <div className="grid gap-3 sm:grid-cols-2">
                                {comparison.data.properties.map((property) => (
                                    <div
                                        key={`${property.source}:${property.externalPropertyId}`}
                                        className="space-y-3 rounded-2xl border border-border/70 bg-card p-4"
                                    >
                                        <h4 className="font-semibold">
                                            {property.title || "—"}
                                        </h4>

                                        {[
                                            [ar ? "السعر" : "Price", property.price],
                                            [ar ? "المساحة" : "Area", property.areaSqm],
                                            [ar ? "غرف النوم" : "Bedrooms", property.bedrooms],
                                            [ar ? "درجة المطابقة" : "Match score", property.matchScore],
                                            [ar ? "ملاءمة السكن" : "Housing score", property.housingScore],
                                            [ar ? "التنقل" : "Commute score", property.commuteScore],
                                            [ar ? "الخدمات" : "Services score", property.servicesScore],
                                        ].map(([label, value]) => (
                                            <div
                                                key={String(label)}
                                                className="flex justify-between gap-3 border-b border-border/40 pb-2 text-sm"
                                            >
                                                <span className="text-muted-foreground">{label}</span>
                                                <span className="font-medium">
                          {typeof value === "number" ? money(value) : "—"}
                        </span>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>

                            {comparison.data.aiAnalysis && (
                                <div className="space-y-3 rounded-2xl bg-secondary/30 p-5">
                                    <h4 className="font-semibold">
                                        {ar ? "رأي مساعد مدار الذكي" : "Madar AI analysis"}
                                    </h4>

                                    {comparison.data.aiAnalysis.recommendedPropertyTitle && (
                                        <p className="text-sm font-medium">
                                            {ar ? "العقار الأنسب:" : "Recommended property:"}{" "}
                                            {comparison.data.aiAnalysis.recommendedPropertyTitle}
                                        </p>
                                    )}

                                    {comparison.data.aiAnalysis.reason && (
                                        <p className="whitespace-pre-line text-sm leading-7">
                                            {comparison.data.aiAnalysis.reason}
                                        </p>
                                    )}

                                    {comparison.data.aiAnalysis.alternativeReason && (
                                        <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
                                            {comparison.data.aiAnalysis.alternativeReason}
                                        </p>
                                    )}

                                    {comparison.data.aiAnalysis.tradeOff && (
                                        <div className="border-t border-border/60 pt-3">
                                            <p className="mb-1 text-sm font-semibold">
                                                {ar ? "نقاط تستحق الانتباه" : "Trade-offs"}
                                            </p>
                                            <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
                                                {comparison.data.aiAnalysis.tradeOff}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <Button variant="outline" onClick={close}>
                                {ar ? "إغلاق المقارنة" : "Close comparison"}
                            </Button>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
