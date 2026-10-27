"use client";
import { formatTimestamp } from "@/lib/format-timestamp";
import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { payments } from "@/lib/api/payments";
import type { Checkout, CommuteReport } from "@/lib/api/discovery-contracts";
import { useCurrentUserId } from "@/features/account/session-hooks";
import { usePlaces } from "@/features/account/api/query-hooks";
import { ErrorState } from "@/components/shared/error-state";
import { Panel } from "@/components/shared/panel";
import { Button } from "@/components/ui/button";
import { MoyasarForm } from "./moyasar-form";
import { GoogleDataAttribution } from "@/components/maps/google-data-attribution";
import {
  PaymentVerificationSkeleton,
  CommuteAnalysisSkeleton,
} from "@/features/payments/skeletons";

export function CommutePanel({
  latitude,
  longitude,
  selectedPlaceId,
  onReport,
}: {
  latitude: number;
  longitude: number;
  selectedPlaceId?: number | null;
  onReport?: (report: CommuteReport | null) => void;
}) {
  const ar = useLocale() === "ar";
  const userId = useCurrentUserId();
  return (
    <Panel
      title={ar ? "هل يناسبك التنقل من هنا؟" : "Does the commute work for you?"}
      description={
        ar
          ? "حلّل القيادة من موقع العقار إلى وجهاتك المحفوظة. الخدمة مدفوعة واختيارية."
          : "Analyze driving from this property to your saved destinations. This is an optional paid service."
      }
    >
      {userId ? (
        <UserCommute
          key={`${userId}:${latitude}:${longitude}`}
          userId={userId}
          latitude={latitude}
          longitude={longitude}
          selectedPlaceId={selectedPlaceId}
          onReport={onReport}
        />
      ) : (
        <Button
          nativeButton={false}
          render={<Link href="/login" />}
          variant="outline"
        >
          {ar ? "سجّل دخولك للمتابعة" : "Sign in to continue"}
        </Button>
      )}
    </Panel>
  );
}
function UserCommute({
  userId,
  latitude,
  longitude,
  selectedPlaceId,
  onReport,
}: {
  userId: number;
  latitude: number;
  longitude: number;
  selectedPlaceId?: number | null;
  onReport?: (report: CommuteReport | null) => void;
}) {
  const destinations = usePlaces(userId);
  const cache = useQueryClient();
  const locale = useLocale();
  const t = useTranslations("Workspace");
  const ar = locale === "ar";
  const access = useQuery({
    queryKey: ["access", userId],
    queryFn: ({ signal }) => payments.access(signal),
    staleTime: 0,
    retry: false,
  });
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [report, setReport] = useState<CommuteReport | null>(null);
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const key = useRef<string | null>(null);
  const perform = async (action: "checkout" | "calculate") => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(undefined);
    setReport(null);
    onReport?.(null);
    try {
      const fresh = await payments.access();
      await cache.invalidateQueries({ queryKey: ["access", userId] });
      if (fresh.access) {
        setCheckout(null);
        const nextReport = await payments.commute(latitude, longitude);
        setReport(nextReport);
        onReport?.(nextReport);
      } else if (action === "checkout") {
        key.current ||=
          sessionStorage.getItem(`madar-checkout-key:${userId}`) || crypto.randomUUID();
        sessionStorage.setItem(`madar-checkout-key:${userId}`, key.current);
        const response = await payments.checkout(key.current);
        if (
          !response.clientSecret?.startsWith("pi_secret_") ||
          !Number.isSafeInteger(response.paymentId) ||
          response.amount <= 0
        )
          throw new Error("Invalid checkout");
        sessionStorage.setItem(`madar-payment:${userId}`, String(response.paymentId));
        sessionStorage.setItem(
          `madar-payment-origin:${userId}`,
          JSON.stringify({ latitude, longitude }),
        );
        setCheckout(response);
      }
    } catch (reason) {
      setError(reason);
    } finally {
      setBusy(false);
      inFlight.current = false;
    }
  };
  return (
    <div className="flex flex-col gap-4">
      {access.isPending || destinations.isPending ? (
        <PaymentVerificationSkeleton />
      ) : access.isError ? (
        <ErrorState
          error={access.error}
          retry={() => void access.refetch()}
          retryDisabled={access.isFetching}
        />
      ) : destinations.isError ? (
        <ErrorState
          error={destinations.error}
          retry={() => void destinations.refetch()}
          retryDisabled={destinations.isFetching}
        />
      ) : !destinations.data?.length ? (
        <p>
          {ar ? "أضف وجهاتك أولًا في " : "First, add destinations under "}
          <Link
            href="/locations"
            className="underline"
          >
            {ar ? "الأماكن المهمة" : "Your places"}
          </Link>
          .
        </p>
      ) : (
        <>
          <details className="rounded-xl bg-secondary/30 p-4">
            <summary className="cursor-pointer text-sm font-medium">
              {ar ? "الوجهات وافتراضات الرحلة" : "Destinations and travel assumptions"} ·{" "}
              {destinations.data.length}
            </summary>
            <p className="my-3 text-xs leading-5 text-muted-foreground">
              {ar
                ? "الأزمنة للاتجاه الواحد. الوقت الأسبوعي يحتسب الذهاب والعودة وفق عدد الزيارات المحفوظة."
                : "Times are for one-way driving. Weekly totals include round trips using your saved visit frequency."}
            </p>
            <ul className="flex flex-col gap-3">
              {destinations.data.map((place) => (
                <li
                  key={place.id}
                  className="flex flex-wrap justify-between gap-2 text-sm"
                >
                  <span>{place.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {place.visitPerWeek} {ar ? "زيارة/أسبوع" : "visits/week"} ·{" "}
                    {ar ? "الأهمية" : "Importance"} {place.importance}/5
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="/locations"
              className="mt-4 inline-block text-sm text-primary underline"
            >
              {ar ? "تعديل الوجهات" : "Edit destinations"}
            </Link>
          </details>
          {access.data?.access ? (
            <p className="text-sm text-primary">
              {ar ? "الوصول متاح حتى " : "Access available until "}
              <bdi>{formatTimestamp(access.data.expiresAt, locale)}</bdi>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {ar
                ? "سيظهر سعر الخدمة قبل إدخال بيانات الدفع."
                : "Review the service price before entering payment details."}
            </p>
          )}
          {!checkout ? (
            <Button
              className="h-auto min-h-11 self-start py-3 whitespace-normal"
              disabled={
                busy ||
                (!access.data?.access &&
                  !process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY?.startsWith("pk_"))
              }
              onClick={() => void perform(access.data?.access ? "calculate" : "checkout")}
            >
              {busy
                ? ar
                  ? "نعالج الطلب"
                  : "Processing"
                : access.data?.access
                  ? ar
                    ? "احسب التنقل الفعلي"
                    : "Calculate commute"
                  : ar
                    ? "عرض السعر والمتابعة للدفع"
                    : "View price and continue"}
            </Button>
          ) : (
            <>
              <p className="text-xl font-bold text-primary">
                {new Intl.NumberFormat(locale).format(checkout.amount / 100)}{" "}
                {checkout.currency}
              </p>
              <p className="text-xs text-muted-foreground">
                {ar ? "صلاحية جلسة الدفع: " : "Checkout expires: "}
                <bdi>{formatTimestamp(checkout.expiresAt, locale)}</bdi>
              </p>
              <MoyasarForm checkout={checkout} />
              <Button
                variant="outline"
                onClick={() => setCheckout(null)}
              >
                {ar ? "مغادرة نموذج الدفع" : "Leave checkout"}
              </Button>
              <p className="text-xs text-muted-foreground">
                {ar
                  ? "مغادرة النموذج لا تلغي محاولة الدفع. تحقق من حالتها في سجل المدفوعات."
                  : "Leaving checkout does not cancel a payment attempt. Check its status in payment history."}
              </p>
            </>
          )}
          {!process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY?.startsWith("pk_") &&
          !access.data?.access ? (
            <p className="text-sm text-muted-foreground">
              {ar
                ? "الدفع غير متاح حاليًا. لم تُنشأ محاولة دفع."
                : "Payment is currently unavailable. No payment attempt was created."}
            </p>
          ) : null}
          <Link
            href="/payments"
            className="text-sm underline"
          >
            {ar
              ? "سجل المدفوعات والتحقق من محاولة سابقة"
              : "Payment history and verification"}
          </Link>
        </>
      )}
      {busy ? (
        access.data?.access ? (
          <CommuteAnalysisSkeleton />
        ) : (
          <PaymentVerificationSkeleton />
        )
      ) : null}
      {error ? (
        <ErrorState
          error={error}
          retry={() => void perform(checkout ? "calculate" : "checkout")}
          retryDisabled={busy}
        />
      ) : null}
      {report ? (
        <section
          role="status"
          className="flex flex-col gap-4 rounded-xl bg-secondary/40 p-5"
        >
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">
                {locale === "ar" ? "إجمالي التنقل الأسبوعي" : "Total weekly commute"}
              </dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums">
                {new Intl.NumberFormat(locale).format(report.totalWeeklyHours)}{" "}
                <span className="text-xs font-normal">
                  {locale === "ar" ? "ساعة" : "hours"}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                {locale === "ar" ? "مؤشر التنقل" : "Commute score"}
              </dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums">
                {new Intl.NumberFormat(locale).format(report.commuteScore)}
              </dd>
            </div>
          </dl>
          <ul className="flex flex-col divide-y divide-border/60">
            {report.commutes
              .filter(
                (item) =>
                  selectedPlaceId == null || item.placePreferenceId === selectedPlaceId,
              )
              .map((item) => (
                <li
                  key={item.placePreferenceId}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                >
                  <span className="font-medium">{item.placeName}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.durationMinutes}{" "}
                    {locale === "ar" ? "دقيقة قيادة" : "min driving"} · {item.distanceKm}{" "}
                    {locale === "ar" ? "كم" : "km"}
                  </span>
                </li>
              ))}
          </ul>
          {selectedPlaceId != null &&
          !report.commutes.some((item) => item.placePreferenceId === selectedPlaceId) ? (
            <p className="text-sm text-muted-foreground">
              {t("commutePlaceUnavailable")}
            </p>
          ) : null}
          <p className="text-xs leading-5 text-muted-foreground">
            {locale === "ar"
              ? "التقدير الأسبوعي يحتسب الذهاب والعودة بحسب عدد الزيارات المحفوظة، وليس ترتيبًا للعقارات."
              : "Weekly estimates include round trips based on saved visit frequency. This is not a property ranking."}
          </p>
          <GoogleDataAttribution />
        </section>
      ) : null}
    </div>
  );
}
