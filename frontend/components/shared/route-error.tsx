"use client";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { CircleAlert, RotateCcw } from "lucide-react";
import { useTransition } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
export type RouteErrorProps = { error: unknown; reset: () => void; retry?: () => void };
type RecoveryProps = RouteErrorProps & {
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
};
const recoveryEnglish: Record<string, string> = {
  "تعذّر عرض هذه الصفحة": "This page could not be displayed",
  "صار خطأ في عرض الصفحة. حاول مرة ثانية أو تابع تصفح البيوت.":
    "This page could not load. Try again or continue browsing homes.",
  "تعذّر عرض صفحة الملف": "Your profile could not be displayed",
  "ما قدرنا نعرض ملفك الآن. حاول مرة ثانية أو تابع تصفح البيوت.":
    "Your profile could not load. Try again or continue browsing homes.",
  "تعذّر عرض اهتماماتك": "Your interests could not be displayed",
  "ما قدرنا نعرض اهتماماتك الآن. حاول مرة ثانية أو تصفّح البيوت.":
    "Your interests could not load. Try again or browse homes.",
  "تعذّر عرض البحث": "Search could not be displayed",
  "ما قدرنا نعرض البحث الآن. حاول مرة ثانية أو ارجع للرئيسية.":
    "Search could not load. Try again or return home.",
  "تعذّر عرض تفاصيل البيت": "Home details could not be displayed",
  "ما قدرنا نعرض تفاصيل هذا الإعلان. حاول مرة ثانية أو شوف خيارات ثانية.":
    "This listing could not load. Try again or explore other options.",
  "تعذّر عرض ملفك": "Your profile could not be displayed",
  "ما قدرنا نعرض حسابك وتفضيلاتك. حاول مرة ثانية، ولا ترسل أي تعديل سابق من جديد.":
    "Your profile and preferences could not load. Try again without resubmitting earlier changes.",
  "تعذّر عرض المدفوعات": "Payments could not be displayed",
  "ما قدرنا نعرض حالة المدفوعات. تحقق منها قبل تبدأ عملية دفع ثانية.":
    "Payment status could not load. Check it before starting another payment.",
  "تعذّر عرض المحفوظات": "Saved homes could not be displayed",
  "ما قدرنا نعرض بيوتي المحفوظة. حاول مرة ثانية. بيوتك ما انحذفت بسبب خطأ العرض.":
    "Saved homes could not load. Try again. This display error did not delete them.",
  "تعذّر عرض البيت المحفوظ": "Saved home could not be displayed",
  "ما قدرنا نعرض مرجع البيت. حاول مرة ثانية أو ارجع للبيوت المحفوظة.":
    "This saved home could not load. Try again or return to saved homes.",
  "تعذّر عرض ملخصك": "Your overview could not be displayed",
  "ما قدرنا نعرض لوحة التحكم. حاول مرة ثانية أو افتح بيوتك المحفوظة.":
    "Your dashboard could not load. Try again or open saved homes.",
  "تعذّر عرض أماكنك المهمة": "Your places could not be displayed",
  "ما قدرنا نعرض أماكنك المحفوظة. حاول مرة ثانية أو ارجع للوحة التحكم.":
    "Your saved places could not load. Try again or return to the dashboard.",
  "تعذّر عرض المقارنة": "Comparison could not be displayed",
  "ما قدرنا نعرض المقارنات. حاول مرة ثانية أو ارجع للبيوت المحفوظة.":
    "Your comparisons could not load. Try again or return to saved homes.",
  "تعذّر عرض التحقق من الدفع": "Payment verification could not be displayed",
  "حالة الدفع ما تأكدت في هذه الصفحة. حاول مرة ثانية أو تحقق من سجل المدفوعات قبل تدفع مجددًا.":
    "Payment status is unconfirmed here. Try again or check payment history before paying again.",
  "تعذّر عرض معلومات الحي": "Neighborhood information could not be displayed",
  "ما قدرنا نعرض بيانات البيت والخدمات القريبة. حاول مرة ثانية أو راجع موقع بيتك في حسابك.":
    "Home and nearby services could not load. Try again or review your home location in your account.",
  "استكشف البيوت": "Explore Properties",
  "العودة للرئيسية": "Back home",
  "العودة للبحث": "Back to search",
  "لوحة التحكم": "Dashboard",
  المحفوظات: "Saved Properties",
  "سجل المدفوعات": "Payment history",
  "الحساب والبيت": "Account and home",
};
export function RouteError({
  reset,
  retry,
  title = "تعذّر عرض هذه الصفحة",
  description = "صار خطأ في عرض الصفحة. حاول مرة ثانية أو تابع تصفح البيوت.",
  backHref = "/properties",
  backLabel = "استكشف البيوت",
}: RecoveryProps) {
  const ar = useLocale() === "ar";
  const localize = (value: string) => (ar ? value : (recoveryEnglish[value] ?? value));
  const [pending, startTransition] = useTransition();
  return (
    <Card
      role="alert"
      className="mx-auto my-6 max-w-xl rounded-2xl border-border/70 shadow-none"
    >
      <CardHeader>
        <span className="mb-1 grid size-10 place-items-center rounded-xl bg-secondary text-primary">
          <CircleAlert aria-hidden="true" />
        </span>
        <CardTitle>
          <h2 className="text-lg font-semibold">{localize(title)}</h2>
        </CardTitle>
        <CardDescription className="leading-7">{localize(description)}</CardDescription>
      </CardHeader>
      <CardFooter className="flex flex-wrap gap-3">
        <Button
          disabled={pending}
          onClick={() => startTransition(() => (retry || reset)())}
        >
          <RotateCcw data-icon="inline-start" />
          {pending
            ? ar
              ? "نعيد المحاولة"
              : "Retrying"
            : ar
              ? "أعد المحاولة"
              : "Try again"}
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={backHref} />}
        >
          {localize(backLabel)}
        </Button>
      </CardFooter>
    </Card>
  );
}
