"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLocale } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeCheck,
  CircleHelp,
  Coins,
  CreditCard,
  History,
  RefreshCw,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import { formatTimestamp } from "@/lib/format-timestamp";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import { Field, FieldLabel } from "@/components/ui/field";
import { getProductCopy } from "@/messages/product-copy";
import { QueryFeedback } from "@/components/shared/query-feedback";
import {
  PaymentHistorySkeleton,
  PaymentVerificationSkeleton,
} from "@/features/payments/skeletons";
import { SummarySkeleton } from "@/components/shared/page-skeleton";
import { getLayoutCopy } from "@/messages/layout-copy";
import { Badge } from "@/components/ui/badge";
import { useIdentity } from "@/features/account/identity";
import { credits, packagePriceHalalas, type CreditPackage } from "@/lib/api/credits";
import { payments } from "@/lib/api/payments";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { Payment } from "@/lib/api/discovery-contracts";
import type { Checkout } from "@/lib/api/discovery-contracts";
import { CommutePanel } from "./commute-panel";
import { MoyasarForm } from "./moyasar-form";
import { validCoordinates } from "@/lib/maps/points";
import { cn } from "@/lib/utils";

const knownPaymentStatuses = ["PENDING", "PAID", "FAILED", "REFUNDED"] as const;

const creditServiceLabels: Record<string, [string, string]> = {
  TOP_3_RECOMMENDATIONS: ["التوصيات الذكية", "Smart recommendations"],
  AI_CHAT: ["محادثة مدار", "Madar AI chat"],
  AI_COMPARISON: ["تحليل المقارنة", "AI comparison"],
  COMMUTE_REPORT: ["تقرير التنقل", "Commute report"],
};

const creditServiceDescriptions: Record<string, [string, string]> = {
  TOP_3_RECOMMENDATIONS: [
    "اقتراحات سكنية مخصصة بناءً على تفضيلاتك.",
    "Personalized home recommendations based on your preferences.",
  ],
  AI_CHAT: [
    "محادثة مع مدار للمساعدة في رحلة البحث.",
    "Chat with Madar for help during your search.",
  ],
  AI_COMPARISON: ["تحليل ذكي لمقارنة البيوت.", "AI analysis to compare homes."],
  COMMUTE_REPORT: [
    "تحليل التنقل إلى الأماكن المهمة المحفوظة.",
    "Commute analysis for your saved important places.",
  ],
};

const creditActivityLabels: Record<string, [string, string]> = {
  WELCOME_BONUS: ["رصيد ترحيبي", "Welcome credits"],
  RESERVED: ["رصيد محجوز مؤقتًا", "Credits reserved"],
  CONSUMED: ["استخدام رصيد", "Credits used"],
  CANCELLED: ["أُلغي حجز الرصيد", "Credit reservation cancelled"],
  REFUND: ["إرجاع رصيد محجوز", "Reserved credits returned"],
  PURCHASE: ["شراء رصيد", "Credit purchase"],
  PURCHASE_REFUND: ["استرداد شراء رصيد", "Credit purchase refund"],
  ADMIN_GIFT: ["رصيد مضاف", "Credits added"],
};

function formatCredits(value: number, locale: string) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
}

function creditDescription(description: string | null, ar: boolean) {
  if (!description) return null;
  if (description === "Credits purchased via Moyasar") {
    return ar ? "تمت إضافة الرصيد بعد تأكيد الدفع." : description;
  }
  if (description.startsWith("Service: ")) {
    const code = description.slice("Service: ".length);
    const labels = creditServiceLabels[code];
    if (labels) return ar ? `الخدمة: ${labels[0]}` : `Service: ${labels[1]}`;
  }
  return description;
}

function formatSar(amountHalalas: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountHalalas / 100);
}

function statusLabel(status: string, ar: boolean) {
  const labels: Record<string, [string, string]> = {
    PENDING: ["قيد التأكيد", "Pending"],
    PAID: ["مدفوع", "Paid"],
    FAILED: ["فشلت أو انتهت المحاولة", "Failed or expired"],
    REFUNDED: ["مسترد", "Refunded"],
  };
  return labels[status]?.[ar ? 0 : 1] ?? status;
}

function paymentBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "PAID") return "default";
  if (status === "FAILED") return "destructive";
  if (status === "REFUNDED") return "outline";
  return "secondary";
}

function SectionHeader({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {description ? (
            <p className="mt-1 max-w-2xl text-xs leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {action}
    </div>
  );
}

function CreditPackageCard({
  item,
  selected,
  locale,
  onSelect,
  disabled,
}: {
  item: CreditPackage;
  selected: boolean;
  locale: string;
  onSelect: () => void;
  disabled: boolean;
}) {
  const ar = locale === "ar";
  const finalPrice = packagePriceHalalas(item);
  const unitPriceHalalas = finalPrice / item.credits;

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-2xl border bg-card p-5 transition-colors",
        selected ? "border-primary ring-2 ring-primary/15" : "border-border/70",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">{item.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {ar ? "باقة كريدت لمرة واحدة" : "One-time credit package"}
          </p>
        </div>
        {item.discountPercent > 0 ? (
          <Badge variant="secondary">
            {new Intl.NumberFormat(locale, {
              style: "percent",
              maximumFractionDigits: 0,
            }).format(item.discountPercent / 100)}{" "}
            {ar ? "خصم" : "off"}
          </Badge>
        ) : null}
      </div>
      <p className="mt-6 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tabular-nums">
          {formatCredits(item.credits, locale)}
        </span>
        <span className="text-sm text-muted-foreground">{ar ? "كريدت" : "credits"}</span>
      </p>
      <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-xl font-semibold tabular-nums">
          {formatSar(finalPrice, locale)}
        </span>
        {item.discountPercent > 0 ? (
          <span className="text-sm text-muted-foreground line-through">
            {formatSar(item.priceHalalas, locale)}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {formatSar(unitPriceHalalas, locale)} {ar ? "للكريدت الواحد" : "per credit"}
      </p>
      <Button
        type="button"
        variant={selected ? "default" : "outline"}
        disabled={disabled}
        aria-pressed={selected}
        onClick={onSelect}
        className="mt-6 min-h-11 w-full rounded-xl"
      >
        {selected
          ? ar
            ? "تم الاختيار"
            : "Selected"
          : ar
            ? "اختر الباقة"
            : "Select package"}
      </Button>
    </article>
  );
}

function PaymentTable({
  rows,
  packages,
  locale,
  onVerify,
  verifyingId,
}: {
  rows: Payment[];
  packages: CreditPackage[];
  locale: string;
  onVerify: (id: number) => void;
  verifyingId: number | null;
}) {
  const ar = locale === "ar";
  const packageName = (serviceType: string) =>
    serviceType === "COMMUTE_REPORT"
      ? ar
        ? "تقرير التنقل"
        : "Commute report"
      : packages.find((item) => item.code === serviceType)?.name || serviceType;

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[620px] text-start text-sm">
          <thead className="border-b text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-3 font-medium">{ar ? "العملية" : "Transaction"}</th>
              <th className="px-3 py-3 font-medium">{ar ? "المبلغ" : "Amount"}</th>
              <th className="px-3 py-3 font-medium">{ar ? "التاريخ" : "Date"}</th>
              <th className="px-3 py-3 font-medium">{ar ? "الحالة" : "Status"}</th>
              <th className="px-3 py-3 font-medium">
                <span className="sr-only">{ar ? "إجراء" : "Action"}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {rows.map((payment) => (
              <tr key={payment.id}>
                <td className="px-3 py-4">
                  <p className="font-medium">{packageName(payment.serviceType)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">#{payment.id}</p>
                </td>
                <td className="px-3 py-4 font-medium tabular-nums">
                  {payment.currency
                    ? formatCurrency(payment.amount, payment.currency, locale)
                    : ar
                      ? "العملة غير محددة"
                      : "Currency unavailable"}
                </td>
                <td className="px-3 py-4 text-xs text-muted-foreground">
                  {formatTimestamp(payment.createdAt, locale)}
                </td>
                <td className="px-3 py-4">
                  <Badge variant={paymentBadgeVariant(payment.status)}>
                    {statusLabel(payment.status, ar)}
                  </Badge>
                </td>
                <td className="px-3 py-4 text-end">
                  {payment.status === "PENDING" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={verifyingId !== null}
                      onClick={() => onVerify(payment.id)}
                    >
                      <RefreshCw data-icon="inline-start" />
                      {verifyingId === payment.id
                        ? ar
                          ? "نتحقق"
                          : "Verifying"
                        : ar
                          ? "تحقق"
                          : "Verify"}
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 md:hidden">
        {rows.map((payment) => (
          <article
            key={payment.id}
            className="rounded-2xl border border-border/70 bg-background p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold">
                  {packageName(payment.serviceType)}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  #{payment.id} · {formatTimestamp(payment.createdAt, locale)}
                </p>
              </div>
              <Badge variant={paymentBadgeVariant(payment.status)}>
                {statusLabel(payment.status, ar)}
              </Badge>
            </div>
            <p className="mt-4 text-lg font-semibold tabular-nums">
              {payment.currency
                ? formatCurrency(payment.amount, payment.currency, locale)
                : ar
                  ? "العملة غير محددة"
                  : "Currency unavailable"}
            </p>
            {payment.status === "PENDING" ? (
              <Button
                type="button"
                variant="outline"
                disabled={verifyingId !== null}
                onClick={() => onVerify(payment.id)}
                className="mt-3 w-full"
              >
                <RefreshCw data-icon="inline-start" />
                {verifyingId === payment.id
                  ? ar
                    ? "نتحقق"
                    : "Verifying"
                  : ar
                    ? "تحقق من الحالة"
                    : "Verify status"}
              </Button>
            ) : null}
          </article>
        ))}
      </div>
    </>
  );
}

function formatCurrency(amountMinor: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
}

export function PaymentsPage() {
  const locale = useLocale();
  const copy = getLayoutCopy(locale);
  const ar = locale === "ar";
  const { userId } = useIdentity();
  const cache = useQueryClient();
  const [status, setStatus] = useState("");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [verified, setVerified] = useState<Payment | null>(null);

  const balance = useQuery({
    queryKey: ["credit-balance", userId],
    queryFn: ({ signal }) => credits.balance(signal),
    retry: false,
  });
  const packages = useQuery({
    queryKey: ["credit-packages"],
    queryFn: ({ signal }) => credits.packages(signal),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const servicePrices = useQuery({
    queryKey: ["credit-service-prices", userId],
    queryFn: ({ signal }) => credits.servicePrices(signal),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const transactions = useQuery({
    queryKey: ["credit-transactions", userId],
    queryFn: ({ signal }) => credits.transactions(signal),
    retry: false,
  });
  const paymentHistory = useQuery({
    queryKey: ["payments", userId, status],
    queryFn: ({ signal }) => payments.history(status || undefined, signal),
    retry: false,
  });

  const selectedPackage =
    packages.data?.find((item) => item.code === selectedCode) ?? null;

  const createCheckout = useMutation({
    mutationFn: async (item: CreditPackage) => {
      const storageKey = `madar-credit-checkout-key:${userId}:${item.code}`;
      let idempotencyKey: string;
      try {
        idempotencyKey = sessionStorage.getItem(storageKey) || crypto.randomUUID();
        sessionStorage.setItem(storageKey, idempotencyKey);
      } catch {
        throw new Error(
          ar
            ? "تعذر حفظ مرجع آمن لمحاولة الدفع. فعّل تخزين الجلسة ثم حاول مجددًا."
            : "A safe checkout reference could not be stored. Enable session storage and retry.",
        );
      }

      const response = await payments.checkout(idempotencyKey, item.code);
      sessionStorage.setItem(`madar-payment:${userId}`, String(response.paymentId));
      sessionStorage.removeItem(`madar-payment-origin:${userId}`);
      return response;
    },
    retry: false,
    onSuccess: async (response) => {
      setCheckout(response);
      await cache.invalidateQueries({ queryKey: ["payments", userId] });
    },
  });

  const verify = useMutation({
    mutationFn: (id: number) => payments.verify(id),
    onMutate: () => setVerified(null),
    onSuccess: async (payment) => {
      setVerified(payment);
      if (payment.status !== "PENDING" && payment.serviceType !== "COMMUTE_REPORT") {
        sessionStorage.removeItem(
          `madar-credit-checkout-key:${userId}:${payment.serviceType}`,
        );
      }
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["payments", userId] }),
        cache.invalidateQueries({ queryKey: ["credit-balance", userId] }),
        cache.invalidateQueries({ queryKey: ["credit-transactions", userId] }),
        cache.invalidateQueries({ queryKey: ["access", userId] }),
      ]);
    },
  });

  const statusFilterLabel = (value: string) => statusLabel(value, ar);
  const serviceLabel = (code: string) =>
    creditServiceLabels[code]?.[ar ? 0 : 1] ?? code.replaceAll("_", " ");
  const historyRows = paymentHistory.data || [];
  const creditRows = transactions.data || [];

  return (
    <div className="flex w-full max-w-[1480px] flex-col gap-5 pb-10">
      <PageHeading
        title={ar ? "المحفظة والمدفوعات" : "Payments & Credits"}
        description={
          ar
            ? "تابع رصيدك واستخدامه، واستعرض باقات الكريدت وسجل عمليات الدفع."
            : "Track your credits, browse available packages, and review your payment activity."
        }
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(19rem,0.9fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <section className="overflow-hidden rounded-3xl border border-primary/20 bg-card shadow-sm">
            <div className="flex flex-col gap-5 bg-primary p-6 text-primary-foreground sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div>
                <p className="text-sm text-primary-foreground/75">
                  {ar ? "رصيدك الحالي" : "Available credit balance"}
                </p>
                {balance.isPending ? (
                  <div
                    className="mt-3 h-10 w-36 rounded-lg bg-primary-foreground/15"
                    aria-label={ar ? "جارٍ تحميل الرصيد" : "Loading balance"}
                  />
                ) : balance.isError ? (
                  <p className="mt-3 text-sm font-medium">
                    {ar ? "تعذر تحميل الرصيد" : "Balance unavailable"}
                  </p>
                ) : (
                  <p className="mt-2 flex items-baseline gap-2">
                    <span className="text-4xl font-semibold tabular-nums sm:text-5xl">
                      {formatCredits(balance.data.balance, locale)}
                    </span>
                    <span className="text-sm text-primary-foreground/75">
                      {ar ? "كريدت" : "credits"}
                    </span>
                  </p>
                )}
                <p className="mt-2 text-xs text-primary-foreground/75">
                  {ar
                    ? "الرصيد بالكريدت، منفصل عن الأسعار بالريال."
                    : "Credits are separate from package prices in SAR."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  nativeButton={false}
                  render={<a href="#credit-packages" />}
                  variant="secondary"
                  className="min-h-11 rounded-xl"
                >
                  <Coins data-icon="inline-start" />
                  {ar ? "شحن الرصيد" : "Recharge credits"}
                </Button>
                <Button
                  nativeButton={false}
                  render={<a href="#credit-activity" />}
                  variant="outline"
                  className="min-h-11 rounded-xl border-primary-foreground/30 bg-primary/20 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  <History data-icon="inline-start" />
                  {ar ? "سجل الاستخدام" : "Credit activity"}
                </Button>
              </div>
            </div>
            {balance.isError ? (
              <div className="p-5">
                <ErrorState
                  error={balance.error}
                  retry={() => void balance.refetch()}
                />
              </div>
            ) : null}
          </section>

          <section
            id="credit-packages"
            className="scroll-mt-24 rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-6"
          >
            <SectionHeader
              icon={WalletCards}
              title={ar ? "باقات الكريدت" : "Credit packages"}
              description={
                ar
                  ? "باقات شراء لمرة واحدة، بالأسعار والرصيد المعتمدين من مدار."
                  : "One-time packages using the prices and credit amounts configured by Madar."
              }
            />
            <div className="mt-5">
              <QueryFeedback query={packages} />
              {packages.isPending ? (
                <PaymentHistorySkeleton />
              ) : packages.isError ? (
                <ErrorState
                  error={packages.error}
                  retry={() => void packages.refetch()}
                />
              ) : !packages.data.length ? (
                <EmptyState
                  title={
                    ar
                      ? "لا توجد باقات متاحة حاليًا"
                      : "No packages are currently available"
                  }
                  description={ar ? "تحقق مرة أخرى لاحقًا." : "Please check again later."}
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                  {packages.data.map((item) => (
                    <CreditPackageCard
                      key={item.id}
                      item={item}
                      locale={locale}
                      selected={selectedCode === item.code}
                      disabled={Boolean(checkout)}
                      onSelect={() => {
                        setSelectedCode(item.code);
                        createCheckout.reset();
                        setVerified(null);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
            <SectionHeader
              icon={BadgeCheck}
              title={ar ? "تكلفة خدمات مدار" : "Madar service costs"}
              description={
                ar
                  ? "التكلفة بالكريدت بحسب الأسعار الحالية من الخادم."
                  : "Credit costs returned by the current backend pricing."
              }
            />
            <div className="mt-4">
              <QueryFeedback query={servicePrices} />
              {servicePrices.isPending ? (
                <SummarySkeleton />
              ) : servicePrices.isError ? (
                <ErrorState
                  error={servicePrices.error}
                  retry={() => void servicePrices.refetch()}
                />
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {Object.entries(servicePrices.data).map(([code, cost]) => (
                    <div
                      key={code}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background p-4"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{serviceLabel(code)}</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {creditServiceDescriptions[code]?.[ar ? 0 : 1] ?? code}
                        </p>
                      </div>
                      <p className="shrink-0 font-semibold tabular-nums">
                        {formatCredits(cost, locale)}{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          {ar ? "كريدت" : "credits"}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section
            id="credit-activity"
            className="scroll-mt-24 rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-6"
          >
            <SectionHeader
              icon={History}
              title={ar ? "سجل استخدام الكريدت" : "Credit activity"}
              description={
                ar
                  ? "حركات الرصيد والحجوزات والإضافات كما سجلها الخادم."
                  : "Balance movements, reservations, and additions recorded by the backend."
              }
            />
            <div className="mt-4">
              <QueryFeedback query={transactions} />
              {transactions.isPending ? (
                <PaymentHistorySkeleton />
              ) : transactions.isError ? (
                <ErrorState
                  error={transactions.error}
                  retry={() => void transactions.refetch()}
                />
              ) : !creditRows.length ? (
                <EmptyState
                  title={ar ? "ما فيه حركات رصيد حتى الآن" : "No credit activity yet"}
                  description={
                    ar
                      ? "ستظهر هنا الإضافات والاستخدامات المسجلة."
                      : "Recorded credit additions and usage will appear here."
                  }
                />
              ) : (
                <div className="flex flex-col divide-y divide-border/60">
                  {creditRows.map((transaction) => {
                    const positive = transaction.amount > 0;
                    const description = creditDescription(transaction.description, ar);
                    const [arLabel, enLabel] = creditActivityLabels[transaction.type] || [
                      transaction.type,
                      transaction.type,
                    ];
                    return (
                      <article
                        key={transaction.id}
                        className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <span
                            className={cn(
                              "grid size-9 shrink-0 place-items-center rounded-lg",
                              positive
                                ? "bg-primary/10 text-primary"
                                : "bg-secondary text-secondary-foreground",
                            )}
                          >
                            {positive ? (
                              <ArrowDownLeft className="size-4" />
                            ) : (
                              <ArrowUpRight className="size-4" />
                            )}
                          </span>
                          <div className="min-w-0">
                            <h3 className="text-sm font-medium">
                              {ar ? arLabel : enLabel}
                            </h3>
                            {description ? (
                              <p className="mt-1 break-words text-xs text-muted-foreground">
                                {description}
                              </p>
                            ) : null}
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatTimestamp(transaction.createdAt, locale)}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {ar ? "الرصيد بعد الحركة" : "Balance after activity"}:{" "}
                              {formatCredits(transaction.balanceAfter, locale)}
                            </p>
                          </div>
                        </div>
                        <p
                          className={cn(
                            "shrink-0 font-semibold tabular-nums",
                            positive ? "text-primary" : "text-foreground",
                          )}
                        >
                          {positive ? "+" : ""}
                          {formatCredits(transaction.amount, locale)}
                          <span className="ms-1 text-xs font-normal text-muted-foreground">
                            {ar ? "كريدت" : "credits"}
                          </span>
                        </p>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
            <SectionHeader
              icon={CreditCard}
              title={ar ? "سجل المدفوعات" : "Payment history"}
              description={
                ar
                  ? "حالات الدفع المعتمدة من Moyasar والخادم."
                  : "Payment statuses verified by Moyasar and the backend."
              }
              action={
                <Field className="w-44">
                  <FieldLabel
                    htmlFor="payment-filter"
                    className="sr-only"
                  >
                    {copy.paymentStatus}
                  </FieldLabel>
                  <Select
                    items={[
                      { value: "", label: copy.allStatuses },
                      ...knownPaymentStatuses.map((value) => ({
                        value: value.toLowerCase(),
                        label: statusFilterLabel(value),
                      })),
                    ]}
                    value={status}
                    onValueChange={(value) => {
                      setStatus(value || "");
                      setVerified(null);
                      verify.reset();
                    }}
                  >
                    <SelectTrigger
                      id="payment-filter"
                      className="h-10 w-full"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="">{copy.allStatuses}</SelectItem>
                        {knownPaymentStatuses.map((value) => (
                          <SelectItem
                            key={value}
                            value={value.toLowerCase()}
                          >
                            {statusFilterLabel(value)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              }
            />
            <div className="mt-4">
              <QueryFeedback query={paymentHistory} />
              {paymentHistory.isPending ? (
                <PaymentHistorySkeleton />
              ) : paymentHistory.isError ? (
                <ErrorState
                  error={paymentHistory.error}
                  retry={() => void paymentHistory.refetch()}
                />
              ) : !historyRows.length ? (
                <EmptyState
                  title={copy.noPayments}
                  description={copy.noPaymentsHint}
                />
              ) : (
                <PaymentTable
                  rows={historyRows}
                  packages={packages.data || []}
                  locale={locale}
                  onVerify={(id) => verify.mutate(id)}
                  verifyingId={verify.isPending ? verify.variables : null}
                />
              )}
              {verify.isError ? (
                <ErrorState
                  error={verify.error}
                  retry={() =>
                    verify.variables != null && verify.mutate(verify.variables)
                  }
                />
              ) : null}
              {verified ? (
                <p
                  role="status"
                  className="mt-4 rounded-xl border bg-secondary/30 p-3 text-sm"
                >
                  {ar ? "الحالة المؤكدة للعملية" : "Verified payment status"} #
                  {verified.id}: {statusLabel(verified.status, ar)}
                </p>
              ) : null}
            </div>
          </section>
        </div>

        <aside className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-5">
          <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
            <SectionHeader
              icon={CreditCard}
              title={ar ? "ملخص الشراء" : "Purchase summary"}
              description={
                ar
                  ? "اختر باقة لعرض ملخص المبلغ قبل إنشاء محاولة الدفع."
                  : "Select a package to review the amount before starting checkout."
              }
            />
            {selectedPackage ? (
              <dl className="mt-5 flex flex-col gap-3 rounded-2xl bg-secondary/35 p-4 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{ar ? "الباقة" : "Package"}</dt>
                  <dd className="text-end font-medium">{selectedPackage.name}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{ar ? "الكريدت" : "Credits"}</dt>
                  <dd className="font-medium tabular-nums">
                    {formatCredits(selectedPackage.credits, locale)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 border-t pt-3">
                  <dt className="font-medium">{ar ? "المبلغ المستحق" : "Amount due"}</dt>
                  <dd className="font-semibold tabular-nums">
                    {formatSar(packagePriceHalalas(selectedPackage), locale)}
                  </dd>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  {ar
                    ? "المبلغ النهائي والعملة يؤكدهما الخادم عند إنشاء العملية. لا يظهر تفصيل مستقل للرسوم في عقد الباقة."
                    : "The backend confirms the final amount and currency at checkout. The package contract does not expose a separate fee breakdown."}
                </p>
              </dl>
            ) : (
              <p className="mt-5 rounded-2xl border border-dashed p-4 text-sm leading-6 text-muted-foreground">
                {ar
                  ? "اختر إحدى الباقات المتاحة لعرض عدد الكريدت والمبلغ."
                  : "Choose an available package to review its credits and price."}
              </p>
            )}

            {!checkout ? (
              <Button
                type="button"
                disabled={
                  !selectedPackage || createCheckout.isPending || packages.isPending
                }
                onClick={() => selectedPackage && createCheckout.mutate(selectedPackage)}
                className="mt-4 min-h-12 w-full rounded-xl"
              >
                {createCheckout.isPending
                  ? ar
                    ? "نجهّز الدفع"
                    : "Preparing checkout"
                  : ar
                    ? "المتابعة إلى الدفع الآمن"
                    : "Continue to secure payment"}
              </Button>
            ) : (
              <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-primary/20 bg-background p-4">
                <div className="flex items-start gap-3">
                  <BadgeCheck className="mt-0.5 size-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">
                      {ar ? "تم تجهيز محاولة الدفع" : "Checkout is ready"}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {ar
                        ? "أكمل الدفع عبر حقول Moyasar الآمنة. لا يُضاف الرصيد قبل تأكيد الخادم."
                        : "Complete payment in Moyasar’s secure fields. Credits are added only after backend confirmation."}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-semibold tabular-nums">
                  {formatCurrency(checkout.amount, checkout.currency, locale)}
                </p>
                <MoyasarForm checkout={checkout} />
              </div>
            )}
            {createCheckout.isError ? (
              <div className="mt-4">
                <ErrorState
                  error={createCheckout.error}
                  retry={() => selectedPackage && createCheckout.mutate(selectedPackage)}
                  retryDisabled={createCheckout.isPending}
                />
              </div>
            ) : null}
            {verified ? (
              <p
                role="status"
                className="mt-4 text-sm text-primary"
              >
                {ar ? "الحالة التي أكدها الخادم:" : "Backend-verified status:"}{" "}
                {statusLabel(verified.status, ar)}
              </p>
            ) : null}
          </section>

          <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
            <SectionHeader
              icon={CircleHelp}
              title={ar ? "معلومات الدفع" : "Payment information"}
            />
            <ul className="mt-4 flex flex-col gap-3 text-xs leading-6 text-muted-foreground">
              <li>
                {ar
                  ? "السعر يحدده الخادم من رمز الباقة؛ ولا يرسل المتصفح مبلغًا معتمدًا."
                  : "The backend prices purchases from the package code; the browser does not set the authoritative amount."}
              </li>
              <li>
                {ar
                  ? "تتم إضافة الكريدت بعد التحقق من حالة الدفع لدى Moyasar."
                  : "Credits are added only after the backend verifies the payment with Moyasar."}
              </li>
              <li>
                {ar
                  ? "لا تتوفر في الواجهة الحالية وسائل دفع محفوظة أو روابط إيصالات من الخادم."
                  : "Saved payment methods and backend receipt links are not available in the current contract."}
              </li>
            </ul>
            <Button
              nativeButton={false}
              render={<Link href="/dashboard" />}
              variant="outline"
              className="mt-5 w-full rounded-xl"
            >
              {ar ? "العودة إلى لوحة التحكم" : "Back to dashboard"}
            </Button>
          </section>
        </aside>
      </div>
    </div>
  );
}

const subscribe = () => () => {};
export function PaymentReturn() {
  const locale = useLocale();
  const text = getProductCopy(locale);
  const ar = locale === "ar";
  const { userId } = useIdentity();
  const cache = useQueryClient();
  const refreshed = useRef<string | null>(null);
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const localId = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return sessionStorage.getItem(`madar-payment:${userId}`);
      } catch {
        return null;
      }
    },
    () => null,
  );
  const origin = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return sessionStorage.getItem(`madar-payment-origin:${userId}`);
      } catch {
        return null;
      }
    },
    () => null,
  );
  const id =
    localId &&
    /^\d+$/.test(localId) &&
    Number(localId) > 0 &&
    Number(localId) <= 2147483647
      ? Number(localId)
      : null;
  const verification = useQuery({
    queryKey: ["payment-verification", userId, id],
    queryFn: ({ signal }) => payments.verify(id!, signal),
    enabled: id !== null,
    staleTime: 0,
    retry: false,
  });
  const isCreditPurchase =
    verification.data != null && verification.data.serviceType !== "COMMUTE_REPORT";
  const isPaidCreditPurchase = isCreditPurchase && verification.data?.status === "PAID";
  const access = useQuery({
    queryKey: ["access-after-verify", userId, verification.dataUpdatedAt],
    queryFn: ({ signal }) => payments.access(signal),
    enabled: verification.data?.serviceType === "COMMUTE_REPORT",
    staleTime: 0,
    retry: false,
  });
  const creditBalance = useQuery({
    queryKey: ["credit-balance", userId],
    queryFn: ({ signal }) => credits.balance(signal),
    enabled: isPaidCreditPurchase,
    staleTime: 0,
    retry: false,
  });
  const creditTransactions = useQuery({
    queryKey: ["credit-transactions", userId],
    queryFn: ({ signal }) => credits.transactions(signal),
    enabled: isPaidCreditPurchase,
    staleTime: 0,
    retry: false,
  });

  useEffect(() => {
    const payment = verification.data;
    if (!payment || verification.isFetching) return;
    const key = `${payment.id}:${payment.status}`;
    if (refreshed.current === key) return;
    refreshed.current = key;
    if (payment.status === "PAID") {
      void Promise.all([
        cache.invalidateQueries({ queryKey: ["credit-balance", userId] }),
        cache.invalidateQueries({ queryKey: ["credit-transactions", userId] }),
        cache.invalidateQueries({ queryKey: ["payments", userId] }),
        cache.invalidateQueries({ queryKey: ["access", userId] }),
      ]);
    }
    if (payment.status !== "PENDING" && payment.serviceType !== "COMMUTE_REPORT") {
      try {
        sessionStorage.removeItem(
          `madar-credit-checkout-key:${userId}:${payment.serviceType}`,
        );
      } catch {
        // Verification remains authoritative even when browser storage is unavailable.
      }
    }
  }, [cache, userId, verification.data, verification.isFetching]);

  let coordinates: { latitude: number; longitude: number } | null = null;
  try {
    const parsed = JSON.parse(origin || "null");
    if (parsed && validCoordinates(parsed.latitude, parsed.longitude))
      coordinates = parsed;
  } catch {
    /* optional return context */
  }

  const statusText = (status: string) =>
    ({
      PENDING: text.pending,
      PAID: text.paid,
      FAILED: text.failed,
      REFUNDED: text.refunded,
    })[status] || (ar ? "حالة غير معروفة" : "Unknown status");

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <PageHeading
        title={text.paymentReturn}
        description={text.paymentReturnHint}
      />
      {!ready ? (
        <PaymentVerificationSkeleton />
      ) : !id ? (
        <EmptyState
          title={text.noSession}
          description={text.noSessionHint}
        >
          <Button
            nativeButton={false}
            render={<Link href="/payments" />}
          >
            {text.paymentHistory}
          </Button>
        </EmptyState>
      ) : verification.isPending ? (
        <PaymentVerificationSkeleton />
      ) : verification.isError ? (
        <ErrorState
          error={verification.error}
          retry={() => void verification.refetch()}
          retryDisabled={verification.isFetching}
        />
      ) : (
        <>
          <p
            role="status"
            className="rounded-2xl border border-border/70 bg-card p-5"
          >
            {statusText(verification.data.status)}
            {verification.data.status === "PENDING" ? `. ${text.pendingPayment}` : ""}
          </p>
          {verification.data.status === "PAID" && isCreditPurchase ? (
            <section className="rounded-2xl border border-border/70 bg-card p-5">
              <h2 className="font-semibold">
                {ar ? "تم تأكيد الدفع" : "Payment confirmed"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {ar
                  ? "أكد الخادم عملية الدفع. يجري تحديث رصيد المحفظة وسجل الكريدت من المصدر المعتمد."
                  : "The backend confirmed this payment. The wallet balance and credit history are being refreshed from the authoritative source."}
              </p>
              {creditBalance.isPending ? (
                <SummarySkeleton />
              ) : creditBalance.isError ? (
                <ErrorState
                  error={creditBalance.error}
                  retry={() => void creditBalance.refetch()}
                />
              ) : (
                <p className="mt-4 text-lg font-semibold tabular-nums">
                  {ar ? "الرصيد الحالي" : "Current balance"}:{" "}
                  {formatCredits(creditBalance.data.balance, locale)}{" "}
                  {ar ? "كريدت" : "credits"}
                </p>
              )}
              {creditTransactions.isError ? (
                <ErrorState
                  error={creditTransactions.error}
                  retry={() => void creditTransactions.refetch()}
                />
              ) : null}
              {creditTransactions.data?.[0] ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  {ar ? "أحدث حركة مسجلة" : "Latest recorded activity"}:{" "}
                  {formatCredits(creditTransactions.data[0].amount, locale)}{" "}
                  {ar ? "كريدت" : "credits"} ·{" "}
                  {formatTimestamp(creditTransactions.data[0].createdAt, locale)}
                </p>
              ) : null}
            </section>
          ) : null}
          {verification.data.serviceType === "COMMUTE_REPORT" ? (
            verification.isFetching || access.isPending || access.isFetching ? (
              <>
                <p role="status">{text.checkingAccess}</p>
                <SummarySkeleton />
              </>
            ) : access.isError ? (
              <ErrorState
                error={access.error}
                retry={() => void access.refetch()}
                retryDisabled={access.isFetching}
              />
            ) : access.data?.access ? (
              <>
                <p className="text-primary">
                  {text.accessUntil}{" "}
                  <bdi>{formatTimestamp(access.data.expiresAt, locale)}</bdi>.
                </p>
                {coordinates ? <CommutePanel {...coordinates} /> : null}
              </>
            ) : (
              <p>{text.noAccess}</p>
            )
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={verification.isFetching}
              onClick={() => void verification.refetch()}
            >
              {text.verifyAgain}
            </Button>
            <Button
              nativeButton={false}
              render={<Link href="/payments" />}
              variant="outline"
            >
              {ar ? "العودة للمحفظة" : "Back to wallet"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
