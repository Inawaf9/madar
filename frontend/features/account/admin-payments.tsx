
"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import {
    CreditCard,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Eye,
    X,
    ReceiptText,
    ShieldCheck,
    CheckCircle2,
    Clock3,
    AlertCircle,
    RotateCcw,
    Wallet,
    CalendarDays,
    Filter,
    ArrowUpLeft,
} from "lucide-react";
import { adminApi, type AdminPayment } from "@/lib/api/admin";
import { ErrorState } from "@/components/shared/error-state";
import { MadarLoader } from "@/components/branding/madar-loader";

const paymentStatuses = [
    { value: "", ar: "كل الحالات", en: "All statuses" },
    { value: "PENDING", ar: "قيد الانتظار", en: "Pending" },
    { value: "PAID", ar: "مكتملة", en: "Paid" },
    { value: "FAILED", ar: "فاشلة", en: "Failed" },
    { value: "REFUNDED", ar: "مستردة", en: "Refunded" },
];

const card =
    "rounded-[26px] border border-[#ded5c7] bg-[#fffcf7] shadow-sm";

const outlineButton =
    "inline-flex items-center justify-center gap-2 rounded-xl border border-[#ded5c7] bg-[#fffcf7] px-4 py-2.5 text-sm font-semibold text-[#414b66] transition-all hover:border-[#a7a5b1] hover:bg-[#f4f0e9] disabled:cursor-not-allowed disabled:opacity-50";

function paymentStatusStyle(status: string) {
    switch (status) {
        case "PAID":
            return "bg-[#e7f1e9] text-[#477554]";
        case "PENDING":
            return "bg-[#faf0df] text-[#a47a3b]";
        case "FAILED":
            return "bg-[#f9eae7] text-[#a65b51]";
        case "REFUNDED":
            return "bg-[#ececf3] text-[#626d88]";
        default:
            return "bg-[#f0ede8] text-[#777986]";
    }
}

function PaymentStatus({
                           status,
                           ar,
                       }: {
    status: string;
    ar: boolean;
}) {
    const item = paymentStatuses.find((entry) => entry.value === status);
    const label = item ? (ar ? item.ar : item.en) : status;

    const Icon =
        status === "PAID"
            ? CheckCircle2
            : status === "FAILED"
                ? AlertCircle
                : status === "REFUNDED"
                    ? RotateCcw
                    : Clock3;

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${paymentStatusStyle(status)}`}
        >
      <Icon className="size-3.5" />
            {label}
    </span>
    );
}

function SummaryCard({
                         label,
                         value,
                         note,
                         icon: Icon,
                     }: {
    label: string;
    value: string | number;
    note: string;
    icon: typeof CreditCard;
}) {
    return (
        <div
            className={`${card} group p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md`}
        >
            <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-medium text-[#777986]">
          {label}
        </span>
                <span className="rounded-2xl bg-[#f0ede8] p-3 text-[#47516d] transition-colors group-hover:bg-[#e7e5e9]">
          <Icon className="size-5" />
        </span>
            </div>
            <p className="mt-4 text-3xl font-bold tabular-nums text-[#292d37]">
                {value}
            </p>
            <p className="mt-2 text-xs text-[#92909a]">{note}</p>
        </div>
    );
}

function serviceLabel(value: string, ar: boolean) {
    if (!ar) return value.replaceAll("_", " ");

    const known: Record<string, string> = {
        CREDITS_250: "باقة 250 رصيد",
        CREDITS_100: "باقة 100 رصيد",
        CREDITS_50: "باقة 50 رصيد",
        PREMIUM: "الاشتراك المميز",
        SUBSCRIPTION: "اشتراك",
    };

    if (known[value]) return known[value];

    const credits = /^CREDITS_(\d+)$/i.exec(value);
    if (credits) return `باقة ${credits[1]} رصيد`;

    return value.replaceAll("_", " ");
}

function DetailRow({
                       label,
                       value,
                   }: {
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#eee8df] py-3.5 last:border-0">
            <span className="text-sm text-[#85838b]">{label}</span>
            <div className="text-end text-sm font-semibold text-[#292d37]">
                {value}
            </div>
        </div>
    );
}

export function AdminPayments() {
    const ar = useLocale() === "ar";

    const [page, setPage] = useState(0);
    const [status, setStatus] = useState("");
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const query = useQuery({
        queryKey: ["admin-payments", page, status],
        queryFn: ({ signal }) =>
            adminApi.payments(signal, page, 10, status || undefined),
        retry: false,
    });

    const details = useQuery({
        queryKey: ["admin-payment-details", selectedId],
        queryFn: ({ signal }) =>
            adminApi.paymentDetails(selectedId!, signal),
        enabled: selectedId !== null,
        retry: false,
    });

    const dashboard = useQuery({
        queryKey: ["admin", "dashboard"],
        queryFn: ({ signal }) => adminApi.dashboard(signal),
        retry: false,
        staleTime: 30_000,
    });

    const stats = dashboard.data as
        | {
        totalPayments: number;
        paidPayments: number;
        pendingPayments: number;
        failedPayments: number;
        refundedPayments: number;
        paidAmountHalalas: number;
    }
        | undefined;

    const number = (value: number) =>
        new Intl.NumberFormat(ar ? "ar-SA" : "en-US").format(value);

    const formatAmount = (amount: number, currency = "SAR") => {
        try {
            return new Intl.NumberFormat(ar ? "ar-SA" : "en-US", {
                style: "currency",
                currency,
                maximumFractionDigits: 2,
            }).format(amount / 100);
        } catch {
            return `${number(amount / 100)} ${currency}`;
        }
    };

    const formatDate = (value: string | null) =>
        value
            ? new Intl.DateTimeFormat(ar ? "ar-SA" : "en-US", {
                dateStyle: "medium",
                timeStyle: "short",
            }).format(new Date(value))
            : "—";

    const selectedPayment = details.data;

    return (
        <main className="mx-auto w-full max-w-7xl space-y-6 pb-12">
            {/* Hero */}
            <section className="relative overflow-hidden rounded-[28px] bg-[#414b66] p-7 text-white md:p-9">
                <div className="pointer-events-none absolute -left-20 -top-24 size-80 rounded-full border border-white/10" />
                <div className="pointer-events-none absolute -left-8 -top-12 size-60 rounded-full border border-white/10" />

                <div className="relative flex flex-wrap items-start justify-between gap-5">
                    <div>
                        <div className="mb-5 flex items-center gap-2 text-sm text-white/70">
                            <ShieldCheck className="size-4" />
                            <span>
                {ar ? "إدارة مدار / المدفوعات" : "MADAR / Payments"}
              </span>
                        </div>

                        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                            {ar ? "إدارة المدفوعات" : "Payment Management"}
                        </h1>

                        <p className="mt-4 max-w-xl text-sm leading-7 text-white/75">
                            {ar
                                ? "متابعة عمليات الدفع، مراجعة حالاتها، والاطلاع على التفاصيل المالية في مكان واحد."
                                : "Monitor transactions, payment statuses, and financial details in one place."}
                        </p>

                        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs text-white/90">
                            <CreditCard className="size-4" />
                            {ar ? "متابعة العمليات المالية" : "Financial Monitoring"}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            void query.refetch();
                            void dashboard.refetch();
                        }}
                        disabled={query.isFetching || dashboard.isFetching}
                        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/20 disabled:opacity-50"
                    >
                        <RefreshCw
                            className={`size-4 ${
                                query.isFetching || dashboard.isFetching
                                    ? "animate-spin"
                                    : ""
                            }`}
                        />
                        {ar ? "تحديث البيانات" : "Refresh Data"}
                    </button>
                </div>
            </section>

            {/* Overview */}
            <section>
                <div className="mb-4">
                    <h2 className="text-xl font-bold text-[#292d37]">
                        {ar ? "الملخص المالي" : "Financial Overview"}
                    </h2>
                    <p className="mt-1 text-sm text-[#85838b]">
                        {ar
                            ? "إحصائيات المدفوعات المسجلة في المنصة"
                            : "Platform payment statistics"}
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard
                        label={ar ? "إجمالي العمليات" : "Total Transactions"}
                        value={
                            stats
                                ? number(stats.totalPayments)
                                : "—"
                        }
                        note={ar ? "جميع حالات الدفع" : "All payment statuses"}
                        icon={ReceiptText}
                    />
                    <SummaryCard
                        label={ar ? "العمليات المكتملة" : "Paid Transactions"}
                        value={stats ? number(stats.paidPayments) : "—"}
                        note={ar ? "مدفوعات ناجحة" : "Successful payments"}
                        icon={CheckCircle2}
                    />
                    <SummaryCard
                        label={ar ? "قيد الانتظار" : "Pending Payments"}
                        value={stats ? number(stats.pendingPayments) : "—"}
                        note={ar ? "لم تكتمل بعد" : "Awaiting completion"}
                        icon={Clock3}
                    />
                    <SummaryCard
                        label={ar ? "المبالغ المدفوعة" : "Paid Amount"}
                        value={
                            stats
                                ? formatAmount(stats.paidAmountHalalas)
                                : "—"
                        }
                        note={
                            ar
                                ? "المدفوعات الناجحة بالريال"
                                : "Successful SAR payments"
                        }
                        icon={Wallet}
                    />
                </div>

                {dashboard.isError && (
                    <p className="mt-3 text-xs text-[#a65b51]">
                        {ar
                            ? "تعذّر تحميل الملخص المالي، لكن سجل المدفوعات ما زال متاحًا."
                            : "Financial summary unavailable. Payment records remain accessible."}
                    </p>
                )}
            </section>

            {/* Records */}
            <section className={`${card} overflow-hidden`}>
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e8e1d7] p-5 md:p-6">
                    <div>
                        <h2 className="text-lg font-bold text-[#292d37]">
                            {ar ? "سجل المدفوعات" : "Payment Records"}
                        </h2>
                        <p className="mt-1 text-xs text-[#85838b]">
                            {ar
                                ? "استعراض العمليات وتفاصيل كل دفعة"
                                : "Review transactions and payment details"}
                        </p>
                    </div>

                    <div className="relative">
                        <Filter className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-[#777986]" />
                        <select
                            value={status}
                            onChange={(event) => {
                                setStatus(event.target.value);
                                setPage(0);
                            }}
                            aria-label={ar ? "تصفية المدفوعات" : "Filter payments"}
                            className="h-11 min-w-44 appearance-none rounded-xl border border-[#ded5c7] bg-[#faf8f4] ps-11 pe-8 text-sm text-[#414b66] outline-none focus:border-[#77809a]"
                        >
                            {paymentStatuses.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {ar ? item.ar : item.en}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {query.isPending ? (
                    <MadarLoader variant="section" />
                ) : query.isError ? (
                    <div className="p-6">
                        <ErrorState
                            error={query.error}
                            retry={() => void query.refetch()}
                        />
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[820px] text-sm">
                                <thead className="bg-[#f7f3ed] text-[#777986]">
                                <tr>
                                    {[
                                        ar ? "رقم العملية" : "Payment ID",
                                        ar ? "الخدمة" : "Service",
                                        ar ? "المبلغ" : "Amount",
                                        ar ? "الحالة" : "Status",
                                        ar ? "تاريخ الإنشاء" : "Created At",
                                        ar ? "التفاصيل" : "Details",
                                    ].map((label) => (
                                        <th
                                            key={label}
                                            className="px-5 py-4 text-start text-xs font-semibold"
                                        >
                                            {label}
                                        </th>
                                    ))}
                                </tr>
                                </thead>

                                <tbody>
                                {query.data.content.map((payment: AdminPayment) => (
                                    <tr
                                        key={payment.id}
                                        className="border-t border-[#eee8df] transition-colors hover:bg-[#faf7f1]"
                                    >
                                        <td className="px-5 py-4">
                        <span className="font-bold tabular-nums text-[#414b66]">
                          #{payment.id}
                        </span>
                                        </td>

                                        <td className="px-5 py-4">
                        <span className="font-medium text-[#292d37]">
                          {serviceLabel(payment.serviceType, ar)}
                        </span>
                                        </td>

                                        <td className="px-5 py-4">
                        <span className="font-bold tabular-nums text-[#292d37]">
                          {formatAmount(
                              payment.amount,
                              payment.currency
                          )}
                        </span>
                                        </td>

                                        <td className="px-5 py-4">
                                            <PaymentStatus status={payment.status} ar={ar} />
                                        </td>

                                        <td className="px-5 py-4 text-xs text-[#777986]">
                        <span className="inline-flex items-center gap-2">
                          <CalendarDays className="size-3.5 text-[#a09ca5]" />
                            {formatDate(payment.createdAt)}
                        </span>
                                        </td>

                                        <td className="px-5 py-4">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedId(payment.id)}
                                                className="inline-flex items-center gap-2 rounded-lg border border-[#ded5c7] bg-white px-3.5 py-2 text-xs font-semibold text-[#414b66] transition hover:border-[#9ca4b5] hover:bg-[#f3f0eb]"
                                            >
                                                <Eye className="size-4" />
                                                {ar ? "عرض" : "View"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>

                            {query.data.content.length === 0 && (
                                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                                    <div className="mb-4 rounded-2xl bg-[#f0ede8] p-4 text-[#85838b]">
                                        <ReceiptText className="size-6" />
                                    </div>
                                    <h3 className="font-semibold text-[#414b66]">
                                        {ar
                                            ? "لا توجد عمليات دفع مطابقة"
                                            : "No matching transactions"}
                                    </h3>
                                    <p className="mt-2 text-sm text-[#92909a]">
                                        {ar
                                            ? "جربي تغيير حالة التصفية."
                                            : "Try changing the status filter."}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#e8e1d7] bg-[#fdfaf5] px-6 py-5">
                            <p className="text-sm text-[#777986]">
                                {ar ? "صفحة" : "Page"}{" "}
                                <span className="font-bold text-[#414b66]">
                  {page + 1}
                </span>{" "}
                                {ar ? "من" : "of"}{" "}
                                <span className="font-bold text-[#414b66]">
                  {Math.max(query.data.totalPages, 1)}
                </span>
                                <span className="ms-3 text-xs text-[#a09ca5]">
                  ({number(query.data.totalElements)}{" "}
                                    {ar ? "عملية" : "transactions"})
                </span>
                            </p>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    disabled={page === 0 || query.isFetching}
                                    onClick={() =>
                                        setPage((value) => Math.max(0, value - 1))
                                    }
                                    className={outlineButton}
                                >
                                    <ChevronRight className="size-4" />
                                    {ar ? "السابق" : "Previous"}
                                </button>

                                <button
                                    type="button"
                                    disabled={
                                        page + 1 >= query.data.totalPages ||
                                        query.isFetching
                                    }
                                    onClick={() => setPage((value) => value + 1)}
                                    className={outlineButton}
                                >
                                    {ar ? "التالي" : "Next"}
                                    <ChevronLeft className="size-4" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </section>

            {/* Details Modal */}
            {selectedId !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1d2333]/60 p-4 backdrop-blur-sm">
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="payment-details-title"
                        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[26px] border border-[#e3dacf] bg-[#fffcf7] shadow-2xl"
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-[#e8e1d7] p-6">
                            <div className="flex items-center gap-3">
                <span className="rounded-2xl bg-[#eceaf0] p-3 text-[#47516d]">
                  <ReceiptText className="size-6" />
                </span>

                                <div>
                                    <h2
                                        id="payment-details-title"
                                        className="text-lg font-bold text-[#292d37]"
                                    >
                                        {ar ? "تفاصيل عملية الدفع" : "Payment Details"}
                                    </h2>
                                    <p className="mt-1 text-xs text-[#85838b]">
                                        {ar
                                            ? "معلومات العملية المالية"
                                            : "Transaction information"}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedId(null)}
                                aria-label={ar ? "إغلاق" : "Close"}
                                className="rounded-lg p-2 text-[#85838b] transition hover:bg-[#f0ede8]"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            {details.isPending ? (
                                <MadarLoader variant="section" />
                            ) : details.isError ? (
                                <ErrorState
                                    error={details.error}
                                    retry={() => void details.refetch()}
                                />
                            ) : selectedPayment ? (
                                <>
                                    <div className="mb-5 rounded-2xl border border-[#e8e1d7] bg-[#f8f4ee] p-5">
                                        <p className="text-xs text-[#85838b]">
                                            {ar ? "قيمة العملية" : "Transaction Amount"}
                                        </p>
                                        <p className="mt-2 text-2xl font-bold text-[#292d37]">
                                            {formatAmount(
                                                selectedPayment.amount,
                                                selectedPayment.currency
                                            )}
                                        </p>
                                        <div className="mt-3">
                                            <PaymentStatus
                                                status={selectedPayment.status}
                                                ar={ar}
                                            />
                                        </div>
                                    </div>

                                    <DetailRow
                                        label={ar ? "رقم العملية" : "Payment ID"}
                                        value={`#${selectedPayment.id}`}
                                    />
                                    <DetailRow
                                        label={ar ? "نوع الخدمة" : "Service"}
                                        value={serviceLabel(
                                            selectedPayment.serviceType,
                                            ar
                                        )}
                                    />
                                    <DetailRow
                                        label={ar ? "تاريخ الإنشاء" : "Created At"}
                                        value={formatDate(selectedPayment.createdAt)}
                                    />
                                    <DetailRow
                                        label={ar ? "تاريخ الدفع" : "Paid At"}
                                        value={formatDate(selectedPayment.paidAt)}
                                    />
                                    <DetailRow
                                        label={ar ? "انتهاء الوصول" : "Access Expires"}
                                        value={formatDate(selectedPayment.accessExpiresAt)}
                                    />
                                    <DetailRow
                                        label={ar ? "المبلغ المسترد" : "Refunded Amount"}
                                        value={
                                            selectedPayment.refundedAmount === null
                                                ? "—"
                                                : formatAmount(
                                                    selectedPayment.refundedAmount,
                                                    selectedPayment.currency
                                                )
                                        }
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setSelectedId(null)}
                                        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#414b66] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#303a54]"
                                    >
                                        {ar ? "إغلاق التفاصيل" : "Close Details"}
                                        <ArrowUpLeft className="size-4" />
                                    </button>
                                </>
                            ) : null}
                        </div>
                    </section>
                </div>
            )}
        </main>
    );
}
