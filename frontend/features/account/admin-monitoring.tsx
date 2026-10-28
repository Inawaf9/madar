
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Activity,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Clock3,
    Database,
    FileClock,
    Globe2,
    RefreshCw,
    Server,
    ShieldCheck,
    TriangleAlert,
    Users,
    WifiOff,
} from "lucide-react";
import { useLocale } from "next-intl";
import {
    adminApi,
    type AdminAuditLog,
    type AdminServiceHealth,
} from "@/lib/api/admin";

const card =
    "rounded-[26px] border border-[#ded5c7] bg-[#fffcf7] shadow-sm";

const button =
    "inline-flex items-center justify-center gap-2 rounded-full border border-[#d9cebd] bg-[#fffcf7] px-5 py-2.5 text-sm font-semibold text-[#303747] transition hover:border-[#47516d] hover:bg-[#f3eee6] disabled:cursor-not-allowed disabled:opacity-40";

function formatDate(value: string, locale: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat(
        locale === "ar" ? "ar-SA" : "en-US",
        {
            dateStyle: "medium",
            timeStyle: "short",
        }
    ).format(date);
}

function SectionHeader({
                           eyebrow,
                           title,
                           description,
                           onRefresh,
                           refreshing,
                       }: {
    eyebrow: string;
    title: string;
    description: string;
    onRefresh: () => void;
    refreshing: boolean;
}) {
    return (
        <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[#47516d]">
                    <ShieldCheck size={17} />
                    {eyebrow}
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-[#292b33] md:text-4xl">
                    {title}
                </h1>

                <p className="mt-3 text-sm leading-7 text-[#797982]">
                    {description}
                </p>
            </div>

            <button
                type="button"
                className={button}
                onClick={onRefresh}
                disabled={refreshing}
            >
                <RefreshCw
                    size={16}
                    className={refreshing ? "animate-spin" : ""}
                />
                تحديث
            </button>
        </div>
    );
}

function StatCard({
                      label,
                      value,
                      icon: Icon,
                  }: {
    label: string;
    value: number | string;
    icon: typeof Activity;
}) {
    return (
        <div className={`${card} p-6`}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm text-[#777986]">{label}</p>
                    <p className="mt-4 text-3xl font-bold text-[#292b33]">
                        {value}
                    </p>
                </div>

                <div className="rounded-2xl bg-[#f0ede8] p-3 text-[#47516d]">
                    <Icon size={21} />
                </div>
            </div>
        </div>
    );
}

function Feedback({
                      error,
                      empty,
                  }: {
    error?: boolean;
    empty?: boolean;
}) {
    return (
        <div className={`${card} px-6 py-14 text-center`}>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f0ede8] text-[#47516d]">
                {error ? <TriangleAlert /> : <FileClock />}
            </div>

            <p className="font-semibold text-[#292b33]">
                {error
                    ? "تعذر تحميل البيانات"
                    : empty
                        ? "لا توجد سجلات حتى الآن"
                        : "جارٍ تحميل البيانات..."}
            </p>

            <p className="mt-2 text-sm text-[#81818a]">
                {error
                    ? "تأكدي من اتصال الباك إند وصلاحيات الأدمن."
                    : empty
                        ? "ستظهر العمليات المسجلة هنا عند توفرها."
                        : "يرجى الانتظار قليلًا."}
            </p>
        </div>
    );
}

function actionLabel(action: string) {
    const labels: Record<string, string> = {
        SUSPEND_USER: "إيقاف مستخدم",
        UNSUSPEND_USER: "إلغاء إيقاف مستخدم",
        DELETE_USER: "حذف مستخدم",
        GIFT_CREDITS: "منح أرصدة",
        USER_SUSPENDED: "إيقاف مستخدم",
        USER_UNSUSPENDED: "إلغاء إيقاف مستخدم",
        USER_DELETED: "حذف مستخدم",
        CREDITS_GIFTED: "منح أرصدة",
    };

    return labels[action] ?? action.replaceAll("_", " ");
}

function actionColor(action: string) {
    const value = action.toUpperCase();

    if (value.includes("DELETE") || value.includes("SUSPEND")) {
        if (!value.includes("UNSUSPEND")) {
            return "bg-[#f9e9e5] text-[#a04b42]";
        }
    }

    if (value.includes("GIFT") || value.includes("UNSUSPEND")) {
        return "bg-[#e9f2e9] text-[#37744d]";
    }

    return "bg-[#eceaf3] text-[#47516d]";
}
function translateAuditDetails(details: string | null, ar: boolean): string {
    if (!details) return ar ? "لا توجد تفاصيل" : "No details";
    if (!ar) return details;

    const gifted = details.match(
        /^Gifted\s+(\d+)\s+credits\.\s*Operation:\s*(.+)$/i
    );

    if (gifted) {
        return `تم منح ${gifted[1]} رصيدًا للمستخدم — رقم العملية: ${gifted[2]}`;
    }

    const translations: Record<string, string> = {
        "User account suspended": "تم إيقاف حساب المستخدم",
        "User account unsuspended": "تم إلغاء إيقاف حساب المستخدم",
        "User account deleted": "تم حذف حساب المستخدم",
    };

    return translations[details.trim()] ?? details;
}

export function AdminAuditLogs() {
    const [page, setPage] = useState(0);
    const locale = useLocale();
    const ar = locale === "ar";

    const query = useQuery({
        queryKey: ["admin", "audit-logs", page],
        queryFn: ({ signal }) => adminApi.auditLogs(page, 10, signal),
        staleTime: 30_000,
    });

    const data = query.data;
    const logs = data?.content ?? [];
    const actions = new Set(logs.map((log) => log.action)).size;
    const admins = new Set(logs.map((log) => log.adminId)).size;

    const stats = [
        {
            label: ar ? "إجمالي العمليات" : "Total Operations",
            value: data?.totalElements ?? "—",
            note: ar ? "جميع العمليات المسجلة" : "All recorded operations",
            icon: FileClock,
        },
        {
            label: ar ? "أنواع العمليات" : "Action Types",
            value: data ? actions : "—",
            note: ar ? "ضمن الصفحة الحالية" : "On current page",
            icon: Activity,
        },
        {
            label: ar ? "المسؤولون" : "Administrators",
            value: data ? admins : "—",
            note: ar ? "ضمن الصفحة الحالية" : "On current page",
            icon: Users,
        },
    ];

    const translatedAction = (action: string) =>
        ar ? actionLabel(action) : action.replaceAll("_", " ");

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
                {ar
                    ? "إدارة مدار / الرقابة الإدارية"
                    : "MADAR / Administrative Oversight"}
              </span>
                        </div>

                        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                            {ar ? "سجل العمليات" : "Audit Logs"}
                        </h1>

                        <p className="mt-4 max-w-xl text-sm leading-7 text-white/75">
                            {ar
                                ? "متابعة الإجراءات الإدارية وتوثيق العمليات المنفذة، مع عرض المسؤول والتاريخ والتفاصيل."
                                : "Review administrative activity, responsible administrators, timestamps and details."}
                        </p>

                        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs text-white/90">
                            <FileClock className="size-4" />
                            {ar ? "توثيق النشاط الإداري" : "Administrative Activity"}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => void query.refetch()}
                        disabled={query.isFetching}
                        className="inline-flex items-center gap-2 self-start rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/20 disabled:opacity-50"
                    >
                        <RefreshCw
                            className={`size-4 ${query.isFetching ? "animate-spin" : ""}`}
                        />
                        {ar ? "تحديث البيانات" : "Refresh Data"}
                    </button>
                </div>
            </section>

            {/* Statistics */}
            <section>
                <div className="mb-4">
                    <h2 className="text-xl font-bold text-[#292d37]">
                        {ar ? "ملخص النشاط الإداري" : "Activity Overview"}
                    </h2>
                    <p className="mt-1 text-sm text-[#85838b]">
                        {ar
                            ? "نظرة سريعة على العمليات المسجلة"
                            : "A quick overview of recorded activity"}
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    {stats.map(({ label, value, note, icon: Icon }) => (
                        <div
                            key={label}
                            className="group rounded-[26px] border border-[#ded5c7] bg-[#fffcf7] p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
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
                    ))}
                </div>
            </section>

            {/* Activity Table */}
            <section className="overflow-hidden rounded-[26px] border border-[#ded5c7] bg-[#fffcf7] shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e8e1d7] p-5 md:p-6">
                    <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-[#f0ede8] p-3 text-[#414b66]">
              <FileClock className="size-5" />
            </span>

                        <div>
                            <h2 className="text-lg font-bold text-[#292d37]">
                                {ar ? "سجل النشاط الإداري" : "Administrative Activity"}
                            </h2>
                            <p className="mt-1 text-xs text-[#85838b]">
                                {ar
                                    ? "العمليات مرتبة من الأحدث إلى الأقدم"
                                    : "Operations ordered newest to oldest"}
                            </p>
                        </div>
                    </div>

                    <span className="rounded-full bg-[#f0ede8] px-3 py-1.5 text-xs font-semibold text-[#414b66]">
            {data?.totalElements ?? 0}{" "}
                        {ar ? "عملية" : "Operations"}
          </span>
                </div>

                {query.isPending || query.isError ? (
                    <div className="p-5">
                        <Feedback error={query.isError} />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-5">
                        <Feedback empty />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-sm">
                            <thead className="bg-[#f7f3ed] text-[#777986]">
                            <tr>
                                {[
                                    ar ? "رقم السجل" : "Record ID",
                                    ar ? "الإجراء" : "Action",
                                    ar ? "المسؤول" : "Administrator",
                                    ar ? "المستخدم المستهدف" : "Target User",
                                    ar ? "التفاصيل" : "Details",
                                    ar ? "التاريخ والوقت" : "Date & Time",
                                ].map((heading) => (
                                    <th
                                        key={heading}
                                        className="px-5 py-4 text-start text-xs font-semibold"
                                    >
                                        {heading}
                                    </th>
                                ))}
                            </tr>
                            </thead>

                            <tbody>
                            {logs.map((log: AdminAuditLog) => (
                                <tr
                                    key={log.id}
                                    className="border-t border-[#eee8df] transition-colors hover:bg-[#faf7f1]"
                                >
                                    <td className="px-5 py-5">
                      <span className="font-bold tabular-nums text-[#414b66]">
                        #{log.id}
                      </span>
                                    </td>

                                    <td className="px-5 py-5">
                      <span
                          title={log.action}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${actionColor(log.action)}`}
                      >
                        <span className="size-1.5 rounded-full bg-current opacity-60" />
                          {translatedAction(log.action)}
                      </span>
                                    </td>

                                    <td className="px-5 py-5">
                      <span className="inline-flex items-center gap-2 font-medium text-[#414b66]">
                        <ShieldCheck className="size-4 text-[#8a90a0]" />
                          {ar ? `مسؤول #${log.adminId}` : `Admin #${log.adminId}`}
                      </span>
                                    </td>

                                    <td className="px-5 py-5">
                                        {log.targetUserId == null ? (
                                            <span className="text-[#a09ca5]">—</span>
                                        ) : (
                                            <span className="rounded-lg bg-[#f0ede8] px-2.5 py-1.5 font-medium text-[#414b66]">
                          #{log.targetUserId}
                        </span>
                                        )}
                                    </td>

                                    <td className="max-w-[320px] px-5 py-5">
                                        <p
                                            className="break-words text-sm leading-6 text-[#777986]"
                                            title={log.details ?? ""}
                                        >
                                            {translateAuditDetails(log.details, ar)}
                                        </p>
                                    </td>

                                    <td className="whitespace-nowrap px-5 py-5">
                      <span className="inline-flex items-center gap-2 text-xs text-[#777986]">
                        <Clock3 className="size-4 text-[#a09ca5]" />
                          {formatDate(log.createdAt, locale)}
                      </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {data && (
                    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#e8e1d7] bg-[#fdfaf5] px-6 py-5">
                        <p className="text-sm text-[#777986]">
                            {ar ? "صفحة" : "Page"}{" "}
                            <span className="font-bold text-[#414b66]">
                {data.number + 1}
              </span>{" "}
                            {ar ? "من" : "of"}{" "}
                            <span className="font-bold text-[#414b66]">
                {Math.max(1, data.totalPages)}
              </span>
                        </p>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                disabled={page === 0 || query.isFetching}
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#ded5c7] bg-[#fffcf7] px-4 py-2.5 text-sm font-semibold text-[#414b66] transition hover:bg-[#f4f0e9] disabled:opacity-50"
                            >
                                <ArrowRight className="size-4" />
                                {ar ? "السابق" : "Previous"}
                            </button>

                            <button
                                type="button"
                                disabled={
                                    page + 1 >= data.totalPages || query.isFetching
                                }
                                onClick={() => setPage((p) => p + 1)}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#ded5c7] bg-[#fffcf7] px-4 py-2.5 text-sm font-semibold text-[#414b66] transition hover:bg-[#f4f0e9] disabled:opacity-50"
                            >
                                {ar ? "التالي" : "Next"}
                                <ArrowLeft className="size-4" />
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}


const serviceNames: Record<string, string> = {
    database: "قاعدة البيانات",
    n8n: "أتمتة n8n",
    moyasar: "بوابة الدفع Moyasar",
    openRouter: "الذكاء الاصطناعي OpenRouter",
    kite: "العقارات KITE",
    googleRoutes: "مسارات Google",
    googlePlaces: "أماكن Google",
};

function statusInfo(status: string) {
    switch (status) {
        case "UP":
            return {
                text: "متصل",
                style: "bg-[#e8f3e9] text-[#36794b]",
                icon: CheckCircle2,
            };
        case "DOWN":
            return {
                text: "متوقف",
                style: "bg-[#fbe8e5] text-[#b34c42]",
                icon: WifiOff,
            };
        case "DEGRADED":
            return {
                text: "أداء متأثر",
                style: "bg-[#fff0d9] text-[#a36b19]",
                icon: TriangleAlert,
            };
        case "NOT_CONFIGURED":
            return {
                text: "غير مهيأ",
                style: "bg-[#eeedf0] text-[#777986]",
                icon: Clock3,
            };
        case "NOT_CHECKED":
            return {
                text: "لم يُفحص",
                style: "bg-[#eeedf0] text-[#777986]",
                icon: Clock3,
            };
        case "PARTIALLY_MONITORED":
            return {
                text: "مراقبة جزئية",
                style: "bg-[#fff0d9] text-[#a36b19]",
                icon: Activity,
            };
        default:
            return {
                text: status,
                style: "bg-[#eeedf0] text-[#777986]",
                icon: Activity,
            };
    }
}

function ServiceCard({
                         name,
                         service,
                         locale,
                     }: {
    name: string;
    service: AdminServiceHealth;
    locale: string;
}) {
    const status = statusInfo(service.status);
    const Icon = status.icon;

    return (
        <div className={`${card} p-6`}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-[#f0ede8] p-3 text-[#47516d]">
                        {name === "database" ? (
                            <Database size={20} />
                        ) : name.startsWith("google") ? (
                            <Globe2 size={20} />
                        ) : (
                            <Server size={20} />
                        )}
                    </div>

                    <div>
                        <h3 className="font-bold text-[#292b33]">
                            {serviceNames[name] ?? name}
                        </h3>
                        <p className="mt-1 text-xs text-[#81818a]">
                            {name}
                        </p>
                    </div>
                </div>

                <span
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${status.style}`}
                >
          <Icon size={13} />
                    {status.text}
        </span>
            </div>

            <p className="mt-5 min-h-10 text-sm leading-6 text-[#777986]">
                {service.message}
            </p>

            <div className="mt-5 flex flex-wrap justify-between gap-3 border-t border-[#e9e2d7] pt-4 text-xs text-[#81818a]">
        <span>
          زمن الاستجابة:{" "}
            {service.responseTimeMs == null
                ? "غير متاح"
                : `${service.responseTimeMs} ms`}
        </span>

                <span>{formatDate(service.checkedAt, locale)}</span>
            </div>
        </div>
    );
}

export function AdminSystemHealthPanel() {
    const locale = useLocale();

    const query = useQuery({
        queryKey: ["admin", "system-health"],
        queryFn: ({ signal }) => adminApi.systemHealth(signal),
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
    });

    const data = query.data;
    const overall = data ? statusInfo(data.status) : null;

    return (
        <div className="space-y-8 pb-10" dir="rtl">
            <SectionHeader
                eyebrow="إدارة مدار / مراقبة الخدمات"
                title="حالة النظام"
                description="نظرة واضحة على اتصال قاعدة البيانات والتكاملات الخارجية وحالة الخدمات."
                onRefresh={() => void query.refetch()}
                refreshing={query.isFetching}
            />

            {query.isPending || query.isError ? (
                <Feedback error={query.isError} />
            ) : data ? (
                <>
                    <section className="relative overflow-hidden rounded-[28px] bg-[#414b66] p-7 text-white md:p-9">
                        <div className="absolute -left-16 -top-20 h-60 w-60 rounded-full border border-white/10" />
                        <div className="absolute -left-5 -top-10 h-40 w-40 rounded-full border border-white/10" />

                        <div className="relative flex flex-wrap items-center justify-between gap-6">
                            <div>
                                <p className="text-sm text-white/70">
                                    الحالة العامة للمنصة
                                </p>

                                <h2 className="mt-3 text-3xl font-bold">
                                    {overall?.text}
                                </h2>

                                <p className="mt-3 text-sm text-white/70">
                                    آخر فحص: {formatDate(data.checkedAt, locale)}
                                </p>
                            </div>

                            <div className="rounded-3xl border border-white/20 bg-white/10 p-5">
                                <Activity size={37} />
                            </div>
                        </div>
                    </section>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                            label="الخدمات المتصلة"
                            value={data.upServices}
                            icon={CheckCircle2}
                        />
                        <StatCard
                            label="الخدمات المتوقفة"
                            value={data.downServices}
                            icon={WifiOff}
                        />
                        <StatCard
                            label="الخدمات المتأثرة"
                            value={data.degradedServices}
                            icon={TriangleAlert}
                        />
                        <StatCard
                            label="غير مفحوصة أو مهيأة"
                            value={data.unverifiedServices}
                            icon={Clock3}
                        />
                    </div>

                    <div>
                        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-bold text-[#292b33]">
                                    تفاصيل الخدمات
                                </h2>
                                <p className="mt-2 text-sm text-[#81818a]">
                                    {data.totalServices} خدمات مرتبطة بالمنصة
                                </p>
                            </div>

                            <span className="text-xs text-[#81818a]">
                نتائج الفحص مخزنة مؤقتًا لمدة{" "}
                                {data.cacheDurationSeconds} ثانية
              </span>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            {Object.entries(data.services).map(
                                ([name, service]) => (
                                    <ServiceCard
                                        key={name}
                                        name={name}
                                        service={service}
                                        locale={locale}
                                    />
                                )
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 rounded-2xl border border-[#ded5c7] bg-[#f5f0e8] p-5 text-sm leading-7 text-[#6e7180]">
                        <ShieldCheck
                            size={20}
                            className="mt-1 shrink-0 text-[#47516d]"
                        />
                        <p>
                            الخدمات التي تظهر بحالة «لم يُفحص» ليست بالضرورة
                            متوقفة. بعض الفحوصات الخارجية معطّلة عمدًا لتجنب
                            استهلاك الطلبات المدفوعة. وتحديث الصفحة قد يعيد
                            استخدام نتيجة الفحص المخزنة مؤقتًا.
                        </p>
                    </div>
                </>
            ) : null}
        </div>
    );
}
