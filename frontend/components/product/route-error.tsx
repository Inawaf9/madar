"use client";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { CircleAlert, RotateCcw } from "lucide-react";
import { useTransition } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
export type RouteErrorProps = { error: unknown; reset: () => void; retry?: () => void };
type RecoveryProps = RouteErrorProps & { title?: string; description?: string; backHref?: string; backLabel?: string };
const recoveryEnglish: Record<string, string> = {
  "تعذّر عرض هذه الصفحة": "This page could not be displayed",
  "حدث خطأ أثناء عرض المحتوى. أعد المحاولة، أو تابع استكشاف العقارات.": "Something went wrong while displaying this page. Try again or continue exploring properties.",
  "تعذّر عرض صفحة الملف": "Your profile could not be displayed",
  "لم نتمكن من عرض صفحة الملف المحلي. أعد المحاولة؛ يمكنك متابعة التصفح العام.": "Your local profile could not be displayed. Try again or continue browsing publicly.",
  "تعذّر عرض اهتماماتك": "Your interests could not be displayed",
  "لم نتمكن من عرض الاهتمامات. أعد المحاولة؛ يبقى الاستكشاف العام متاحًا.": "Your interests could not be displayed. Try again; public browsing remains available.",
  "تعذّر عرض البحث": "Search could not be displayed",
  "لم نتمكن من عرض أدوات البحث أو النتائج. أعد المحاولة؛ يمكنك أيضًا العودة إلى الرئيسية.": "Search controls or results could not be displayed. Try again or return home.",
  "تعذّر عرض تفاصيل العقار": "Property details could not be displayed",
  "لم نتمكن من عرض تفاصيل هذا الإعلان. أعد المحاولة أو تابع البحث عن خيارات أخرى.": "This listing could not be displayed. Try again or explore other options.",
  "تعذّر عرض ملفك": "Your profile could not be displayed",
  "لم نتمكن من عرض معلومات الملف والتفضيلات. أعد المحاولة دون إعادة إرسال تعديلات سابقة.": "Your profile and preferences could not be displayed. Retry without submitting previous edits again.",
  "تعذّر عرض المدفوعات": "Payments could not be displayed",
  "لم نتمكن من عرض حالة المدفوعات. أعد المحاولة قبل بدء شراء آخر؛ لا نفترض نجاح عملية أو فشلها.": "Payment status could not be displayed. Retry before making another purchase; no payment outcome is assumed.",
  "تعذّر عرض المحفوظات": "Saved properties could not be displayed",
  "حدث خطأ أثناء عرض القائمة. أعد المحاولة؛ لا يعني هذا حذف عقاراتك المحفوظة.": "The saved list could not be displayed. Retry; this does not mean your saved properties were deleted.",
  "تعذّر عرض العقار المحفوظ": "Saved property could not be displayed",
  "لم نتمكن من عرض هذا المرجع وتفاصيله. أعد المحاولة أو ارجع إلى المحفوظات.": "This saved reference and its details could not be displayed. Retry or return to saved properties.",
  "تعذّر عرض ملخصك": "Your overview could not be displayed",
  "لم نتمكن من عرض لوحة المتابعة. أعد المحاولة أو انتقل إلى عقاراتك المحفوظة.": "Your dashboard could not be displayed. Retry or open your saved properties.",
  "تعذّر عرض أماكنك المهمة": "Your places could not be displayed",
  "لم نتمكن من عرض الوجهات المحفوظة. أعد المحاولة أو تابع من لوحة المتابعة.": "Your saved destinations could not be displayed. Retry or return to the dashboard.",
  "تعذّر عرض المقارنة": "Comparison could not be displayed",
  "لم نتمكن من عرض المقارنات. أعد المحاولة أو ارجع إلى عقاراتك المحفوظة.": "Your comparisons could not be displayed. Retry or return to saved properties.",
  "تعذّر عرض التحقق من الدفع": "Payment verification could not be displayed",
  "حالة الدفع غير مؤكدة في هذه الصفحة. أعد المحاولة أو تحقق من العملية في سجل المدفوعات قبل الشراء مجددًا.": "Payment status is unconfirmed here. Retry or verify it in payment history before purchasing again.",
  "تعذّر عرض معلومات الحي": "Neighborhood information could not be displayed",
  "لم نتمكن من عرض بيانات المنزل والخدمات القريبة. أعد المحاولة أو راجع منزلك في الملف.": "Home and nearby service information could not be displayed. Retry or review your home in your profile.",
  "استكشف العقارات": "Explore properties", "العودة للرئيسية": "Back home", "العودة للبحث": "Back to search", "لوحة المتابعة": "Dashboard", "المحفوظات": "Saved properties", "سجل المدفوعات": "Payment history", "الملف والمنزل": "Profile and home",
};
export function RouteError({ reset, retry, title = "تعذّر عرض هذه الصفحة", description = "حدث خطأ أثناء عرض المحتوى. أعد المحاولة، أو تابع استكشاف العقارات.", backHref = "/properties", backLabel = "استكشف العقارات" }: RecoveryProps) {
  const ar = useLocale() === "ar"; const localize = (value: string) => ar ? value : recoveryEnglish[value] ?? value;
  const [pending, startTransition] = useTransition();
  return <Card role="alert" className="mx-auto my-6 max-w-xl rounded-2xl border-border/70 shadow-none"><CardHeader><span className="mb-1 grid size-10 place-items-center rounded-xl bg-secondary text-primary"><CircleAlert aria-hidden="true" /></span><CardTitle><h2 className="text-lg font-semibold">{localize(title)}</h2></CardTitle><CardDescription className="leading-7">{localize(description)}</CardDescription></CardHeader><CardFooter className="flex flex-wrap gap-3"><Button disabled={pending} onClick={() => startTransition(() => (retry || reset)())}><RotateCcw data-icon="inline-start" />{pending ? ar ? "جارٍ إعادة المحاولة…" : "Retrying…" : ar ? "أعد المحاولة" : "Try again"}</Button><Button variant="outline" nativeButton={false} render={<Link href={backHref} />}>{localize(backLabel)}</Button></CardFooter></Card>;
}
