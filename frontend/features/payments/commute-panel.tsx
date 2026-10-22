"use client";
import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { payments } from "@/lib/api/discovery";
import type { Checkout, CommuteReport } from "@/lib/api/discovery-contracts";
import { useLocalUserId } from "@/features/product/local-user";
import { usePlaces } from "@/features/account/api/hooks";
import { ErrorState, Panel } from "@/features/product/shared";
import { Button } from "@/components/ui/button";
import { MoyasarForm } from "./moyasar-form";

export function CommutePanel({ latitude, longitude }: { latitude: number; longitude: number }) {
  const userId = useLocalUserId();
  return <Panel title="تنقّلك اليومي من هذا العقار" description="تحليل مدفوع اختياري يعتمد على وجهاتك المحفوظة وبيانات القيادة الفعلية.">{userId ? <UserCommute key={userId} userId={userId} latitude={latitude} longitude={longitude} /> : <Button nativeButton={false} render={<Link href="/login" />} variant="outline">اختر ملفك المحلي للمتابعة</Button>}</Panel>;
}
function UserCommute({ userId, latitude, longitude }: { userId: number; latitude: number; longitude: number }) {
  const destinations = usePlaces(userId); const cache = useQueryClient(); const locale = useLocale();
  const access = useQuery({ queryKey: ["access", userId], queryFn: ({ signal }) => payments.access(userId, signal), staleTime: 0, retry: false });
  const [checkout, setCheckout] = useState<Checkout | null>(null); const [report, setReport] = useState<CommuteReport | null>(null);
  const [error, setError] = useState<unknown>(); const [busy, setBusy] = useState(false); const inFlight = useRef(false); const key = useRef<string | null>(null);
  const perform = async (action: "checkout" | "calculate") => {
    if (inFlight.current) return; inFlight.current = true; setBusy(true); setError(undefined); setReport(null);
    try {
      const fresh = await payments.access(userId);
      await cache.invalidateQueries({ queryKey: ["access", userId] });
      if (fresh.access) { setCheckout(null); setReport(await payments.commute(userId, latitude, longitude)); }
      else if (action === "checkout") {
        key.current ||= sessionStorage.getItem(`madar-checkout-key:${userId}`) || crypto.randomUUID();
        sessionStorage.setItem(`madar-checkout-key:${userId}`, key.current);
        const response = await payments.checkout(userId, key.current);
        if (!response.clientSecret?.startsWith("pi_secret_") || !Number.isSafeInteger(response.paymentId) || response.amount <= 0) throw new Error("Invalid checkout");
        sessionStorage.setItem(`madar-payment:${userId}`, String(response.paymentId));
        sessionStorage.setItem(`madar-payment-origin:${userId}`, JSON.stringify({ latitude, longitude }));
        setCheckout(response);
      }
    } catch (reason) { setError(reason); } finally { setBusy(false); inFlight.current = false; }
  };
  return <div className="flex flex-col gap-4">
    {access.isPending || destinations.isPending ? <p role="status">جارٍ التحقق من الوصول والوجهات…</p> : access.isError ? <ErrorState error={access.error} retry={() => void access.refetch()} /> : destinations.isError ? <ErrorState error={destinations.error} retry={() => void destinations.refetch()} /> : !destinations.data?.length ? <p>أضف وجهاتك أولًا من <Link href="/locations" className="underline">الأماكن المهمة</Link>.</p> : <>
      {access.data?.access ? <p className="text-sm text-primary">الوصول متاح حتى <bdi>{access.data.expiresAt || "—"}</bdi></p> : <p className="text-sm text-muted-foreground">سيظهر السعر المعتمد من الخادم قبل إدخال بيانات الدفع.</p>}
      {!checkout ? <Button disabled={busy || (!access.data?.access && !process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY?.startsWith("pk_"))} onClick={() => void perform(access.data?.access ? "calculate" : "checkout")}>{busy ? "جارٍ المعالجة…" : access.data?.access ? "احسب التنقل الفعلي" : "عرض سعر الخدمة والمتابعة للدفع"}</Button> : <>
        <p className="text-xl font-bold text-primary">{new Intl.NumberFormat(locale).format(checkout.amount / 100)} {checkout.currency}</p>
        <p className="text-xs text-muted-foreground">صلاحية جلسة الدفع: <bdi>{checkout.expiresAt}</bdi></p>
        <MoyasarForm checkout={checkout} />
        <Button variant="outline" onClick={() => setCheckout(null)}>مغادرة نموذج الدفع</Button><p className="text-xs text-muted-foreground">مغادرة النموذج لا تلغي محاولة المزوّد. تحقق من حالتها في سجل المدفوعات.</p>
      </>}
      {!process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY?.startsWith("pk_") && !access.data?.access ? <p className="text-sm text-muted-foreground">الدفع غير متاح حتى إعداد المفتاح العام لـMoyasar. لم تُنشأ محاولة دفع.</p> : null}
      <Link href="/payments" className="text-sm underline">سجل المدفوعات والتحقق من محاولة سابقة</Link>
    </>}
    {error ? <ErrorState error={error} retry={() => void perform(checkout ? "calculate" : "checkout")} /> : null}
    {report ? <div role="status" className="flex flex-col gap-3 rounded-2xl bg-secondary p-4"><p>إجمالي التنقل الأسبوعي: {report.totalWeeklyHours} ساعة — مؤشر التنقل من الخادم: {report.commuteScore}</p>{report.commutes.map(item => <p key={item.placePreferenceId}>{item.placeName}: {item.durationMinutes} دقيقة قيادة، {item.distanceKm} كم</p>)}<p className="text-xs text-muted-foreground">التقدير الأسبوعي يحتسب الذهاب والعودة بحسب عدد الزيارات المحفوظة، وليس ترتيبًا للعقارات.</p></div> : null}
  </div>;
}
