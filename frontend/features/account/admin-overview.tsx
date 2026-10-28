
"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { adminApi } from "@/lib/api/admin";
import { MadarLoader } from "@/components/branding/madar-loader";
import { ErrorState } from "@/components/shared/error-state";
import {
    Activity,
    ArrowUpLeft,
    CheckCircle2,
    Coins,
    CreditCard,
    RefreshCw,
    ScrollText,
    ShieldCheck,
    TrendingUp,
    UsersRound,
    UserRoundX,
    Wallet,
    CalendarDays,
    ChevronLeft,
} from "lucide-react";

type MonthlyRegistration = {
    month: string;
    registrations: number;
};

type Dashboard = {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    suspendedUsers: number;
    newUsersLast30Days: number;
    totalPayments: number;
    paidPayments: number;
    pendingPayments: number;
    failedPayments: number;
    refundedPayments: number;
    paidAmountHalalas: number;
    monthlyRegistrations: MonthlyRegistration[];
};

const panel =
    "rounded-[26px] border border-[#ded5c7] bg-[#fffcf7] shadow-sm";

function formatNumber(value: number, ar: boolean) {
    return new Intl.NumberFormat(ar ? "ar-SA" : "en-US").format(value);
}

function formatMoney(value: number, ar: boolean) {
    return new Intl.NumberFormat(ar ? "ar-SA" : "en-US", {
        style: "currency",
        currency: "SAR",
    }).format(value / 100);
}

function monthName(month: string, ar: boolean) {
    const date = new Date(`${month}-01T12:00:00`);
    if (Number.isNaN(date.getTime())) return month;

    return new Intl.DateTimeFormat(ar ? "ar-SA" : "en-US", {
        month: "short",
    }).format(date);
}

function Metric({
                    label,
                    value,
                    note,
                    icon: Icon,
                }: {
    label: string;
    value: string;
    note: string;
    icon: typeof Activity;
}) {
    return (
        <div className={`${panel} group p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md`}>
            <div className="flex items-start justify-between gap-3">
                <span className="text-sm text-[#85838b]">{label}</span>
                <div className="rounded-2xl bg-[#f0ede8] p-3 text-[#47516d] transition-colors group-hover:bg-[#e6e5eb]">
                    <Icon size={20} />
                </div>
            </div>

            <p className="mt-4 text-3xl font-bold tabular-nums text-[#292b33]">
                {value}
            </p>

            <p className="mt-2 text-xs text-[#85838b]">{note}</p>
        </div>
    );
}

function GrowthChart({
                         data,
                         ar,
                     }: {
    data: MonthlyRegistration[];
    ar: boolean;
}) {
    const width = 720;
    const height = 250;
    const left = 30;
    const right = 24;
    const top = 24;
    const bottom = 44;

    const values = data.map((item) => item.registrations);
    const maximum = Math.max(1, ...values);
    const maxY = Math.max(4, Math.ceil(maximum * 1.2));

    const x = (index: number) =>
        left +
        (index * (width - left - right)) /
        Math.max(1, data.length - 1);

    const y = (value: number) =>
        top +
        (1 - value / maxY) * (height - top - bottom);

    const points = data.map((item, index) => ({
        x: x(index),
        y: y(item.registrations),
        value: item.registrations,
        month: item.month,
    }));

    const line = points
        .map((point, index) =>
            `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
        )
        .join(" ");

    const area =
        points.length > 0
            ? `${line} L ${points[points.length - 1].x} ${height - bottom} L ${points[0].x} ${height - bottom} Z`
            : "";

    return (
        <div className={`${panel} min-w-0 p-6 md:p-7`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <TrendingUp size={19} className="text-[#47516d]" />
                        <h2 className="text-lg font-bold text-[#292b33]">
                            {ar ? "نمو المستخدمين" : "User Growth"}
                        </h2>
                    </div>
                    <p className="mt-2 text-sm text-[#85838b]">
                        {ar
                            ? "التسجيلات الجديدة خلال آخر 6 أشهر"
                            : "New registrations over the last 6 months"}
                    </p>
                </div>

                <span className="rounded-full bg-[#f0ede8] px-3 py-1.5 text-xs text-[#47516d]">
          {ar ? "بيانات فعلية" : "Live data"}
        </span>
            </div>

            {data.length === 0 ? (
                <div className="flex h-60 items-center justify-center text-sm text-[#85838b]">
                    {ar ? "لا تتوفر بيانات شهرية" : "No monthly data"}
                </div>
            ) : (
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="mt-6 h-auto w-full overflow-visible"
                    role="img"
                    aria-label={ar ? "رسم نمو التسجيلات الشهرية" : "Monthly registrations chart"}
                >
                    <defs>
                        <linearGradient id="madar-growth" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#47516d" stopOpacity="0.22" />
                            <stop offset="100%" stopColor="#47516d" stopOpacity="0.01" />
                        </linearGradient>
                    </defs>

                    {[0, 1, 2, 3, 4].map((step) => {
                        const value = (maxY / 4) * step;
                        const py = y(value);

                        return (
                            <g key={step}>
                                <line
                                    x1={left}
                                    y1={py}
                                    x2={width - right}
                                    y2={py}
                                    stroke="#e9e3da"
                                    strokeDasharray="4 6"
                                />
                                <text
                                    x={left - 10}
                                    y={py + 4}
                                    textAnchor="end"
                                    fontSize="11"
                                    fill="#98949b"
                                >
                                    {Math.round(value)}
                                </text>
                            </g>
                        );
                    })}

                    <path d={area} fill="url(#madar-growth)" />
                    <path
                        d={line}
                        fill="none"
                        stroke="#47516d"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {points.map((point, index) => (
                        <g key={`${point.month}-${index}`}>
                            <circle
                                cx={point.x}
                                cy={point.y}
                                r="6"
                                fill="#fffcf7"
                                stroke="#47516d"
                                strokeWidth="3"
                            >
                                <title>
                                    {monthName(point.month, ar)}: {point.value}
                                </title>
                            </circle>

                            <text
                                x={point.x}
                                y={height - 15}
                                textAnchor="middle"
                                fontSize="13"
                                fill="#777986"
                            >
                                {monthName(point.month, ar)}
                            </text>
                        </g>
                    ))}
                </svg>
            )}
        </div>
    );
}

function PaymentChart({
                          data,
                          ar,
                      }: {
    data: Dashboard;
    ar: boolean;
}) {
    const items = [
        {
            label: ar ? "مكتملة" : "Paid",
            value: data.paidPayments,
            color: "#47516d",
        },
        {
            label: ar ? "معلقة" : "Pending",
            value: data.pendingPayments,
            color: "#c9a66d",
        },
        {
            label: ar ? "فاشلة" : "Failed",
            value: data.failedPayments,
            color: "#bd756c",
        },
        {
            label: ar ? "مستردة" : "Refunded",
            value: data.refundedPayments,
            color: "#9ca4b5",
        },
    ];

    const total = data.totalPayments;
    let angle = 0;

    const segments = items
        .filter((item) => item.value > 0 && total > 0)
        .map((item) => {
            const start = angle;
            angle += (item.value / total) * 360;
            return `${item.color} ${start}deg ${angle}deg`;
        });

    if (total > 0 && angle < 360) {
        segments.push(`#e8e2d9 ${angle}deg 360deg`);
    }

    const gradient =
        total > 0
            ? `conic-gradient(${segments.join(", ")})`
            : "conic-gradient(#e8e2d9 0deg 360deg)";

    return (
        <div className={`${panel} p-6 md:p-7`}>
            <div className="flex items-center gap-2">
                <CreditCard size={19} className="text-[#47516d]" />
                <h2 className="text-lg font-bold text-[#292b33]">
                    {ar ? "حالة المدفوعات" : "Payment Status"}
                </h2>
            </div>

            <p className="mt-2 text-sm text-[#85838b]">
                {ar ? "توزيع عمليات الدفع المسجلة" : "Recorded payment distribution"}
            </p>

            <div className="my-8 flex justify-center">
                <div
                    className="relative flex size-48 items-center justify-center rounded-full transition-transform duration-500 hover:scale-105"
                    style={{ background: gradient }}
                    role="img"
                    aria-label={ar ? "توزيع حالات المدفوعات" : "Payment status distribution"}
                >
                    <div className="flex size-[142px] flex-col items-center justify-center rounded-full bg-[#fffcf7]">
            <span className="text-4xl font-bold text-[#292b33]">
              {formatNumber(total, ar)}
            </span>
                        <span className="mt-1 text-xs text-[#85838b]">
              {ar ? "عملية دفع" : "Payments"}
            </span>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {items.map((item) => (
                    <div
                        key={item.label}
                        className="flex items-center justify-between gap-3 text-sm"
                    >
            <span className="flex items-center gap-2 text-[#777986]">
              <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
              />
                {item.label}
            </span>

                        <span className="font-semibold tabular-nums text-[#292b33]">
              {formatNumber(item.value, ar)}
            </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

const links = [
    { href: "/admin/users", icon: UsersRound, ar: "إدارة المستخدمين", en: "Users" },
    { href: "/admin/payments", icon: CreditCard, ar: "المدفوعات", en: "Payments" },
    { href: "/admin/credits", icon: Coins, ar: "الأرصدة والباقات", en: "Credits & Packages" },
    { href: "/admin/audit-logs", icon: ScrollText, ar: "سجل العمليات", en: "Audit Logs" },
    { href: "/admin/system-health", icon: Activity, ar: "حالة النظام", en: "System Health" },
] as const;

export function AdminOverview() {
    const ar = useLocale() === "ar";

    const query = useQuery({
        queryKey: ["admin", "dashboard"],
        queryFn: ({ signal }) => adminApi.dashboard(signal),
        retry: false,
        staleTime: 30_000,
    });

    if (query.isPending) {
        return <MadarLoader variant="section" />;
    }

    if (query.isError) {
        return (
            <ErrorState
                error={query.error}
                retry={() => void query.refetch()}
            />
        );
    }

    const data = query.data as Dashboard;

    return (
        <main className="mx-auto w-full max-w-7xl space-y-7 pb-12">
            <section className="relative overflow-hidden rounded-[28px] bg-[#414b66] p-7 text-white md:p-10">
                <div className="pointer-events-none absolute -left-20 -top-24 size-80 rounded-full border border-white/10" />
                <div className="pointer-events-none absolute -left-10 -top-14 size-60 rounded-full border border-white/10" />

                <div className="relative flex flex-wrap items-start justify-between gap-6">
                    <div>
                        <div className="mb-5 flex items-center gap-2 text-sm text-white/75">
                            <ShieldCheck size={18} />
                            {ar ? "إدارة مدار / الرئيسية" : "MADAR / Overview"}
                        </div>

                        <h1 className="text-3xl font-bold md:text-4xl">
                            {ar ? "لوحة إدارة مدار" : "MADAR Dashboard"}
                        </h1>

                        <p className="mt-4 max-w-xl text-sm leading-7 text-white/75">
                            {ar
                                ? "كل ما تحتاجينه لمتابعة المنصة، في مكان واحد."
                                : "Everything you need to monitor your platform."}
                        </p>

                        <div className="mt-7 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs">
                <CheckCircle2 size={15} />
                  {ar ? "إحصائيات المنصة" : "Platform Analytics"}
              </span>

                            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs">
                <CalendarDays size={15} />
                                {ar ? "آخر 30 يومًا" : "Last 30 days"}
              </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => void query.refetch()}
                        disabled={query.isFetching}
                        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm transition hover:bg-white/20 disabled:opacity-50"
                    >
                        <RefreshCw
                            size={16}
                            className={query.isFetching ? "animate-spin" : ""}
                        />
                        {ar ? "تحديث البيانات" : "Refresh"}
                    </button>
                </div>
            </section>

            <section>
                <div className="mb-4">
                    <h2 className="text-xl font-bold text-[#292b33]">
                        {ar ? "نظرة عامة" : "Overview"}
                    </h2>
                    <p className="mt-1 text-sm text-[#85838b]">
                        {ar ? "ملخص أداء منصة مدار" : "MADAR platform summary"}
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Metric
                        label={ar ? "إجمالي المستخدمين" : "Total Users"}
                        value={formatNumber(data.totalUsers, ar)}
                        note={ar ? "الحسابات المسجلة" : "Registered accounts"}
                        icon={UsersRound}
                    />
                    <Metric
                        label={ar ? "المستخدمون النشطون" : "Active Users"}
                        value={formatNumber(data.activeUsers, ar)}
                        note={ar ? "حسابات نشطة وغير موقوفة" : "Active accounts"}
                        icon={CheckCircle2}
                    />
                    <Metric
                        label={ar ? "المستخدمون الموقوفون" : "Suspended Users"}
                        value={formatNumber(data.suspendedUsers, ar)}
                        note={ar ? "موقوفة بواسطة الإدارة" : "Suspended by admin"}
                        icon={UserRoundX}
                    />
                    <Metric
                        label={ar ? "تسجيلات آخر 30 يومًا" : "New Users (30 Days)"}
                        value={formatNumber(data.newUsersLast30Days, ar)}
                        note={ar ? "حسابات جديدة" : "New registrations"}
                        icon={TrendingUp}
                    />
                    <Metric
                        label={ar ? "إجمالي المدفوعات" : "Total Payments"}
                        value={formatNumber(data.totalPayments, ar)}
                        note={ar ? "جميع الحالات" : "All statuses"}
                        icon={CreditCard}
                    />
                    <Metric
                        label={ar ? "المدفوعات المكتملة" : "Paid Payments"}
                        value={formatNumber(data.paidPayments, ar)}
                        note={ar ? "عمليات دفع ناجحة" : "Successful payments"}
                        icon={CheckCircle2}
                    />
                    <Metric
                        label={ar ? "المدفوعات المعلقة" : "Pending Payments"}
                        value={formatNumber(data.pendingPayments, ar)}
                        note={ar ? "بانتظار الإكمال" : "Awaiting completion"}
                        icon={Activity}
                    />
                    <Metric
                        label={ar ? "إجمالي المبالغ المدفوعة" : "Paid Amount"}
                        value={formatMoney(data.paidAmountHalalas, ar)}
                        note={ar ? "مدفوعات ناجحة بالريال فقط" : "Paid SAR transactions only"}
                        icon={Wallet}
                    />
                </div>
            </section>

            <section className="grid items-start gap-5 xl:grid-cols-[1.65fr_1fr]">
                <GrowthChart data={data.monthlyRegistrations ?? []} ar={ar} />
                <PaymentChart data={data} ar={ar} />
            </section>

            <section className={`${panel} p-6 md:p-7`}>
                <div className="mb-5">
                    <h2 className="text-xl font-bold text-[#292b33]">
                        {ar ? "إدارة المنصة" : "Platform Management"}
                    </h2>
                    <p className="mt-2 text-sm text-[#85838b]">
                        {ar ? "وصول سريع إلى جميع أقسام الإدارة" : "Quick access to admin sections"}
                    </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {links.map(({ href, icon: Icon, ar: arLabel, en }) => (
                        <Link
                            key={href}
                            href={href}
                            className="group flex items-center justify-between gap-4 rounded-2xl border border-[#e6ded3] bg-[#faf7f1] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#9ca4b5] hover:bg-white hover:shadow-sm"
                        >
                            <div className="flex items-center gap-3">
                <span className="rounded-xl bg-[#ebe9e7] p-3 text-[#47516d]">
                  <Icon size={19} />
                </span>

                                <span className="text-sm font-semibold text-[#292b33]">
                  {ar ? arLabel : en}
                </span>
                            </div>

                            {ar ? (
                                <ChevronLeft size={17} className="text-[#85838b] transition-transform group-hover:-translate-x-1" />
                            ) : (
                                <ArrowUpLeft size={17} className="text-[#85838b]" />
                            )}
                        </Link>
                    ))}
                </div>
            </section>
        </main>
    );
}
