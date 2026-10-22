"use client";
import Script from "next/script";
import { useEffect, useId, useRef, useState } from "react";
import { useLocale } from "next-intl";
import type { Checkout } from "@/lib/api/discovery-contracts";
import { Skeleton } from "@/components/ui/skeleton";

type MoyasarConfig = { element: string; amount: number; currency: string; description: string; publishable_api_key: string; callback_url: string; methods: string[]; given_id: string; metadata: Record<string, string>; use_payment_intent: boolean; payment_intent: { id: string; client_secret: string }; language: string; on_completed: () => Promise<void>; on_failure: () => Promise<void> };
declare global { interface Window { Moyasar?: { init: (options: MoyasarConfig) => void } } }
export function MoyasarForm({ checkout }: { checkout: Checkout }) {
  const locale = useLocale(); const id = `moyasar-${useId().replace(/[^a-z0-9]/gi, "")}`;
  const root = useRef<HTMLDivElement>(null); const [loaded, setLoaded] = useState(false); const [failed, setFailed] = useState(false); const [submitted, setSubmitted] = useState(false);
  const key = process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY;
  useEffect(() => {
    if (!loaded || !root.current || !window.Moyasar || !key?.startsWith("pk_")) return;
    const element = root.current;
    try {
      window.Moyasar.init({ element: `#${id}`, amount: checkout.amount, currency: checkout.currency,
        description: "MADAR COMMUTE_REPORT", publishable_api_key: key,
        callback_url: `${window.location.origin}/${locale}/payments/return`,
        methods: ["creditcard"], given_id: checkout.givenId, metadata: checkout.metadata,
        use_payment_intent: true, payment_intent: { id: checkout.intentId, client_secret: checkout.clientSecret },
        language: locale, on_completed: async () => setSubmitted(true), on_failure: async () => setFailed(true),
      });
    } catch { element.textContent = "تعذّرت تهيئة نموذج الدفع. تحقق من الإعدادات ثم أعد تحميل الصفحة."; }
    return () => { element.replaceChildren(); };
  }, [loaded, checkout, id, key, locale]);
  if (!key?.startsWith("pk_")) return <p role="status" className="text-sm text-muted-foreground">نموذج الدفع غير متاح: يلزم إعداد مفتاح Moyasar العام للمتصفح.</p>;
  return <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/moyasar-payment-form@2.3.0/dist/moyasar.css" />
    <Script src="https://cdn.jsdelivr.net/npm/moyasar-payment-form@2.3.0/dist/moyasar.umd.min.js" strategy="afterInteractive" onReady={() => setLoaded(true)} onError={() => setFailed(true)} />
    {!loaded && !failed ? <Skeleton className="h-64 w-full" /> : null}
    {failed ? <p role="alert" className="text-sm text-destructive">تعذّر تحميل النموذج أو لم تكتمل المحاولة. تحقق من الدفع في سجل المدفوعات قبل بدء محاولة أخرى.</p> : null}
    {submitted ? <p role="status">أُرسلت العملية إلى المزوّد. لن يُفعّل الوصول حتى تأكيد الخادم.</p> : null}
    <div id={id} ref={root} className="[&_input]:font-sans [&_input]:bg-background! [&_input]:text-foreground! [&_input:focus]:border-ring! [&_label]:text-foreground! [&_button]:font-sans [&_button[type=submit]]:rounded-xl! [&_button[type=submit]]:bg-primary! [&_button[type=submit]]:text-primary-foreground!" />
    <p className="text-xs leading-6 text-muted-foreground">بيانات البطاقة يعالجها Moyasar مباشرة. المبلغ والعملة ووجهة العودة معتمدة في Payment Intent من الخادم.</p>
  </div>;
}
