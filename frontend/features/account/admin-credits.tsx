
"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Coins,
    Plus,
    Pencil,
    Ban,
    CheckCircle2,
    RefreshCw,
    X,
    Package,
    Percent,
    ShieldCheck,
    Layers3,
    PackageCheck,
    PackageX,
    Tag,
    AlertTriangle,
    Save,
} from "lucide-react";

import { AdminGiftCredits } from "./admin-gift-credits";
import {
    adminApi,
    type AdminCreditPackage,
    type AdminCreditPackageInput,
} from "@/lib/api/admin";
import { MadarLoader } from "@/components/branding/madar-loader";
import { ErrorState } from "@/components/shared/error-state";

const emptyForm: AdminCreditPackageInput = {
    code: "",
    name: "",
    credits: 100,
    priceHalalas: 100,
    discountPercent: 0,
    active: true,
};

const card =
    "rounded-[26px] border border-[#ded5c7] bg-[#fffcf7] shadow-sm";
const primary =
    "inline-flex items-center justify-center gap-2 rounded-xl bg-[#414b66] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#303a54] disabled:cursor-not-allowed disabled:opacity-50";
const outline =
    "inline-flex items-center justify-center gap-2 rounded-xl border border-[#ded5c7] bg-[#fffcf7] px-4 py-2.5 text-sm font-semibold text-[#414b66] transition hover:bg-[#f4f0e9] disabled:cursor-not-allowed disabled:opacity-50";
const field =
    "h-11 w-full rounded-xl border border-[#ded5c7] bg-[#faf8f4] px-4 text-sm text-[#292d37] outline-none transition focus:border-[#77809a] focus:ring-2 focus:ring-[#77809a]/10 disabled:opacity-50";
const modal =
    "max-h-[90vh] w-full overflow-y-auto rounded-[28px] border border-[#e3dacf] bg-[#fffcf7] shadow-2xl";
const overlay =
    "fixed inset-0 z-50 flex items-center justify-center bg-[#1d2333]/60 p-4 backdrop-blur-sm";

function SummaryCard({
                         label,
                         value,
                         note,
                         icon: Icon,
                     }: {
    label: string;
    value: number;
    note: string;
    icon: typeof Coins;
}) {
    return (
        <div className={`${card} group p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md`}>
            <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-[#777986]">{label}</p>
                <span className="rounded-2xl bg-[#f0ede8] p-3 text-[#47516d] transition-colors group-hover:bg-[#e7e5e9]">
          <Icon className="size-5" />
        </span>
            </div>
            <p className="mt-4 text-3xl font-bold text-[#292d37] tabular-nums">
                {value}
            </p>
            <p className="mt-2 text-xs text-[#92909a]">{note}</p>
        </div>
    );
}

export function AdminCredits() {
    const ar = useLocale() === "ar";
    const queryClient = useQueryClient();

    const [editing, setEditing] = useState<AdminCreditPackage | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [form, setForm] = useState<AdminCreditPackageInput>(emptyForm);
    const [formError, setFormError] = useState("");

    const [confirmDisable, setConfirmDisable] =
        useState<AdminCreditPackage | null>(null);

    const [discountPackage, setDiscountPackage] =
        useState<AdminCreditPackage | null>(null);
    const [discountValue, setDiscountValue] = useState("");
    const [discountError, setDiscountError] = useState("");
    const [removeDiscount, setRemoveDiscount] = useState(false);

    const query = useQuery({
        queryKey: ["admin-credit-packages"],
        queryFn: ({ signal }) => adminApi.creditPackages(signal),
        retry: false,
    });

    const refresh = async () => {
        await queryClient.invalidateQueries({
            queryKey: ["admin-credit-packages"],
        });
    };

    const money = (halalas: number) =>
        new Intl.NumberFormat(ar ? "ar-SA" : "en-US", {
            style: "currency",
            currency: "SAR",
        }).format(halalas / 100);

    const discountedPrice = (price: number, percent: number) =>
        Math.floor((price * (100 - percent)) / 100);

    const saveMutation = useMutation({
        mutationFn: () =>
            editing
                ? adminApi.updateCreditPackage(editing.id, form)
                : adminApi.createCreditPackage(form),
        onSuccess: async () => {
            setFormOpen(false);
            setEditing(null);
            setFormError("");
            await refresh();
        },
        onError: (error) => {
            setFormError(
                error instanceof Error
                    ? error.message
                    : ar ? "تعذر حفظ الباقة" : "Could not save package"
            );
        },
    });

    const disableMutation = useMutation({
        mutationFn: (id: number) => adminApi.deactivateCreditPackage(id),
        onSuccess: async () => {
            setConfirmDisable(null);
            await refresh();
        },
    });

    const discountMutation = useMutation({
        mutationFn: ({
                         item,
                         percent,
                     }: {
            item: AdminCreditPackage;
            percent: number;
        }) =>
            adminApi.updateCreditPackage(item.id, {
                code: item.code,
                name: item.name,
                credits: item.credits,
                priceHalalas: item.priceHalalas,
                discountPercent: percent,
                active: item.active,
            }),
        onSuccess: async () => {
            setDiscountPackage(null);
            setDiscountValue("");
            setDiscountError("");
            setRemoveDiscount(false);
            await refresh();
        },
        onError: (error) => {
            setDiscountError(
                error instanceof Error
                    ? error.message
                    : ar ? "تعذر تعديل الخصم" : "Could not update discount"
            );
        },
    });

    const openCreate = () => {
        setEditing(null);
        setForm({ ...emptyForm });
        setFormError("");
        setFormOpen(true);
    };

    const openEdit = (item: AdminCreditPackage) => {
        setEditing(item);
        setForm({
            code: item.code,
            name: item.name,
            credits: item.credits,
            priceHalalas: item.priceHalalas,
            discountPercent: item.discountPercent,
            active: item.active,
        });
        setFormError("");
        setFormOpen(true);
    };

    const openDiscount = (item: AdminCreditPackage, remove = false) => {
        setDiscountPackage(item);
        setRemoveDiscount(remove);
        setDiscountValue(
            remove ? "0" : item.discountPercent > 0
                ? String(item.discountPercent)
                : ""
        );
        setDiscountError("");
        discountMutation.reset();
    };

    const finalHalalas = discountedPrice(
        form.priceHalalas,
        form.discountPercent
    );

    const save = () => {
        if (
            !form.code.trim() ||
            !form.name.trim() ||
            !Number.isSafeInteger(form.credits) ||
            form.credits < 1 ||
            !Number.isSafeInteger(form.priceHalalas) ||
            form.priceHalalas < 100 ||
            !Number.isInteger(form.discountPercent) ||
            form.discountPercent < 0 ||
            form.discountPercent > 100 ||
            finalHalalas < 100
        ) {
            setFormError(
                ar
                    ? "راجعي البيانات: يجب أن يكون السعر النهائي ريالًا واحدًا على الأقل."
                    : "Check the values. Final price must be at least 1 SAR."
            );
            return;
        }

        setFormError("");
        saveMutation.mutate();
    };

    const discountPercent = Number(discountValue);
    const validDiscount =
        discountValue.trim() !== "" &&
        Number.isInteger(discountPercent) &&
        discountPercent >= 0 &&
        discountPercent <= 100 &&
        discountPackage !== null &&
        discountedPrice(
            discountPackage.priceHalalas,
            discountPercent
        ) >= 100;

    const packages = query.data ?? [];
    const activeCount = packages.filter((p) => p.active).length;
    const inactiveCount = packages.filter((p) => !p.active).length;

    return (
        <main className="mx-auto w-full max-w-7xl space-y-6 pb-12">
            {/* Header */}
            <section className="relative overflow-hidden rounded-[28px] bg-[#414b66] p-7 text-white md:p-9">
                <div className="pointer-events-none absolute -left-20 -top-24 size-80 rounded-full border border-white/10" />
                <div className="pointer-events-none absolute -left-8 -top-12 size-60 rounded-full border border-white/10" />

                <div className="relative flex flex-wrap items-start justify-between gap-5">
                    <div>
                        <div className="mb-5 flex items-center gap-2 text-sm text-white/70">
                            <ShieldCheck className="size-4" />
                            <span>
                {ar ? "إدارة مدار / الأرصدة والباقات" : "MADAR / Credits & Packages"}
              </span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                            {ar ? "الأرصدة والباقات" : "Credits & Packages"}
                        </h1>
                        <p className="mt-4 max-w-xl text-sm leading-7 text-white/75">
                            {ar
                                ? "إدارة باقات الأرصدة وأسعارها وخصوماتها، والتحكم في إتاحتها للمستخدمين."
                                : "Manage credit packages, pricing, discounts, and availability."}
                        </p>
                        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs text-white/90">
                            <Coins className="size-4" />
                            {ar ? "إدارة الرصيد" : "Credit Management"}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => void query.refetch()}
                        disabled={query.isFetching}
                        className="inline-flex items-center gap-2 self-start rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/20 disabled:opacity-50"
                    >
                        <RefreshCw className={`size-4 ${query.isFetching ? "animate-spin" : ""}`} />
                        {ar ? "تحديث البيانات" : "Refresh Data"}
                    </button>
                </div>
            </section>

            {/* Overview */}
            <section>
                <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-[#292d37]">
                            {ar ? "ملخص الباقات" : "Packages Overview"}
                        </h2>
                        <p className="mt-1 text-sm text-[#85838b]">
                            {ar ? "حالة الباقات المتاحة في المنصة" : "Platform package availability"}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <AdminGiftCredits />
                        <button type="button" onClick={openCreate} className={primary}>
                            <Plus className="size-4" />
                            {ar ? "إضافة باقة" : "Add Package"}
                        </button>
                    </div>
                </div>

                {query.isPending ? (
                    <MadarLoader variant="section" />
                ) : query.isError ? (
                    <ErrorState
                        error={query.error}
                        retry={() => void query.refetch()}
                    />
                ) : (
                    <div className="grid gap-4 sm:grid-cols-3">
                        <SummaryCard
                            label={ar ? "إجمالي الباقات" : "Total Packages"}
                            value={packages.length}
                            note={ar ? "كل الباقات المسجلة" : "All registered packages"}
                            icon={Layers3}
                        />
                        <SummaryCard
                            label={ar ? "الباقات المفعّلة" : "Active Packages"}
                            value={activeCount}
                            note={ar ? "متاحة للمستخدمين" : "Available to users"}
                            icon={PackageCheck}
                        />
                        <SummaryCard
                            label={ar ? "الباقات المعطّلة" : "Inactive Packages"}
                            value={inactiveCount}
                            note={ar ? "غير متاحة للشراء" : "Unavailable for purchase"}
                            icon={PackageX}
                        />
                    </div>
                )}
            </section>

            {/* Packages */}
            {!query.isPending && !query.isError && (
                <section className={`${card} overflow-hidden`}>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8e1d7] p-5 md:p-6">
                        <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-[#f0ede8] p-3 text-[#414b66]">
                <Package className="size-5" />
              </span>
                            <div>
                                <h2 className="text-lg font-bold text-[#292d37]">
                                    {ar ? "إدارة باقات الأرصدة" : "Manage Packages"}
                                </h2>
                                <p className="mt-1 text-xs text-[#85838b]">
                                    {ar
                                        ? "الأسعار والخصومات وحالة كل باقة"
                                        : "Pricing, discounts, and availability"}
                                </p>
                            </div>
                        </div>
                        <span className="rounded-full bg-[#f0ede8] px-3 py-1.5 text-xs font-semibold text-[#414b66]">
              {packages.length} {ar ? "باقة" : "Packages"}
            </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1050px] text-sm">
                            <thead className="bg-[#f7f3ed] text-[#777986]">
                            <tr>
                                {[
                                    ar ? "الباقة" : "Package",
                                    ar ? "الأرصدة" : "Credits",
                                    ar ? "السعر" : "Price",
                                    ar ? "الخصم" : "Discount",
                                    ar ? "السعر النهائي" : "Final Price",
                                    ar ? "الحالة" : "Status",
                                    ar ? "الإجراءات" : "Actions",
                                ].map((heading) => (
                                    <th
                                        key={heading}
                                        className="px-4 py-4 text-start text-xs font-semibold"
                                    >
                                        {heading}
                                    </th>
                                ))}
                            </tr>
                            </thead>

                            <tbody>
                            {packages.map((item) => (
                                <tr
                                    key={item.id}
                                    className="border-t border-[#eee8df] transition-colors hover:bg-[#faf7f1]"
                                >
                                    <td className="px-4 py-4">
                                        <p className="font-semibold text-[#292d37]">
                                            {item.name}
                                        </p>
                                        <bdi className="mt-1 block text-xs text-[#92909a]">
                                            {item.code}
                                        </bdi>
                                    </td>
                                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 font-bold text-[#414b66]">
                        <Coins className="size-4 text-[#a08a64]" />
                          {item.credits}
                      </span>
                                    </td>
                                    <td className="px-4 py-4 text-[#777986]">
                                        {money(item.priceHalalas)}
                                    </td>
                                    <td className="px-4 py-4">
                                        {item.discountPercent > 0 ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-[#f8efdf] px-3 py-1.5 text-xs font-semibold text-[#a47a3b]">
                          <Tag className="size-3.5" />
                                                {item.discountPercent}%
                        </span>
                                        ) : (
                                            <span className="text-xs text-[#a09ca5]">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 font-bold text-[#414b66]">
                                        {money(
                                            discountedPrice(
                                                item.priceHalalas,
                                                item.discountPercent
                                            )
                                        )}
                                    </td>
                                    <td className="px-4 py-4">
                      <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                              item.active
                                  ? "bg-[#e7f1e9] text-[#477554]"
                                  : "bg-[#f0ece6] text-[#81796e]"
                          }`}
                      >
                        <span
                            className={`size-1.5 rounded-full ${
                                item.active ? "bg-[#5c9168]" : "bg-[#a49b8e]"
                            }`}
                        />
                          {item.active
                              ? ar ? "مفعّلة" : "Active"
                              : ar ? "معطّلة" : "Inactive"}
                      </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => openEdit(item)}
                                                className={outline}
                                            >
                                                <Pencil className="size-3.5" />
                                                {ar ? "تعديل" : "Edit"}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => openDiscount(item)}
                                                className={outline}
                                            >
                                                <Percent className="size-3.5" />
                                                {item.discountPercent > 0
                                                    ? ar ? "تعديل الخصم" : "Edit Discount"
                                                    : ar ? "إضافة خصم" : "Add Discount"}
                                            </button>

                                            {item.discountPercent > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => openDiscount(item, true)}
                                                    className={outline}
                                                >
                                                    <X className="size-3.5" />
                                                    {ar ? "إزالة الخصم" : "Remove Discount"}
                                                </button>
                                            )}

                                            {item.active ? (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        disableMutation.reset();
                                                        setConfirmDisable(item);
                                                    }}
                                                    className="inline-flex items-center gap-2 rounded-xl border border-[#f0d9d5] bg-[#fff8f7] px-4 py-2.5 text-sm font-semibold text-[#a65b51] transition hover:bg-[#fbece9]"
                                                >
                                                    <Ban className="size-3.5" />
                                                    {ar ? "تعطيل" : "Disable"}
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => openEdit(item)}
                                                    className={outline}
                                                >
                                                    <CheckCircle2 className="size-3.5" />
                                                    {ar ? "تفعيل" : "Activate"}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>

                        {packages.length === 0 && (
                            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <span className="mb-4 rounded-2xl bg-[#f0ede8] p-4 text-[#85838b]">
                  <Package className="size-6" />
                </span>
                                <p className="font-semibold text-[#414b66]">
                                    {ar ? "لا توجد باقات حاليًا" : "No packages yet"}
                                </p>
                                <p className="mt-2 text-sm text-[#92909a]">
                                    {ar
                                        ? "يمكنك إنشاء أول باقة من زر إضافة باقة."
                                        : "Create your first package using Add Package."}
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Create / Edit Modal */}
            {formOpen && (
                <div className={overlay}>
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="package-form-title"
                        className={`${modal} max-w-xl`}
                    >
                        <div className="flex items-center justify-between gap-4 border-b border-[#eee8df] p-6">
                            <div className="flex items-center gap-3">
                <span className="rounded-2xl bg-[#eceaf0] p-3 text-[#414b66]">
                  {editing ? <Pencil className="size-5" /> : <Plus className="size-5" />}
                </span>
                                <div>
                                    <p className="mb-1 text-xs text-[#85838b]">
                                        {ar ? "إدارة الباقات" : "Package Management"}
                                    </p>
                                    <h2
                                        id="package-form-title"
                                        className="text-xl font-bold text-[#292d37]"
                                    >
                                        {editing
                                            ? ar ? "تعديل الباقة" : "Edit Package"
                                            : ar ? "إضافة باقة جديدة" : "New Package"}
                                    </h2>
                                </div>
                            </div>
                            <button
                                type="button"
                                disabled={saveMutation.isPending}
                                onClick={() => setFormOpen(false)}
                                aria-label={ar ? "إغلاق" : "Close"}
                                className="rounded-lg p-2 text-[#85838b] hover:bg-[#f0ede8] disabled:opacity-50"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <form
                            className="grid gap-5 p-6 sm:grid-cols-2"
                            onSubmit={(event) => {
                                event.preventDefault();
                                save();
                            }}
                        >
                            <label className="space-y-2 text-sm">
                <span className="font-semibold text-[#414b66]">
                  {ar ? "كود الباقة" : "Package Code"}
                </span>
                                <input
                                    required
                                    maxLength={50}
                                    disabled={!!editing}
                                    value={form.code}
                                    onChange={(event) =>
                                        setForm({ ...form, code: event.target.value })
                                    }
                                    className={field}
                                    placeholder="CREDITS_100"
                                />
                            </label>

                            <label className="space-y-2 text-sm">
                <span className="font-semibold text-[#414b66]">
                  {ar ? "اسم الباقة" : "Package Name"}
                </span>
                                <input
                                    required
                                    maxLength={100}
                                    value={form.name}
                                    onChange={(event) =>
                                        setForm({ ...form, name: event.target.value })
                                    }
                                    className={field}
                                />
                            </label>

                            <label className="space-y-2 text-sm">
                <span className="font-semibold text-[#414b66]">
                  {ar ? "عدد الأرصدة" : "Credits"}
                </span>
                                <input
                                    required
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={form.credits}
                                    onChange={(event) =>
                                        setForm({ ...form, credits: Number(event.target.value) })
                                    }
                                    className={field}
                                />
                            </label>

                            <label className="space-y-2 text-sm">
                <span className="font-semibold text-[#414b66]">
                  {ar ? "السعر بالريال" : "Price in SAR"}
                </span>
                                <input
                                    required
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    value={form.priceHalalas / 100}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            priceHalalas: Math.round(
                                                Number(event.target.value) * 100
                                            ),
                                        })
                                    }
                                    className={field}
                                />
                            </label>

                            <label className="space-y-2 text-sm">
                <span className="font-semibold text-[#414b66]">
                  {ar ? "نسبة الخصم %" : "Discount %"}
                </span>
                                <input
                                    required
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="1"
                                    value={form.discountPercent}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            discountPercent: Number(event.target.value),
                                        })
                                    }
                                    className={field}
                                />
                            </label>

                            <label className="flex items-center gap-3 self-end rounded-xl border border-[#ded5c7] bg-[#faf8f4] p-3 text-sm font-medium text-[#414b66]">
                                <input
                                    type="checkbox"
                                    checked={form.active}
                                    onChange={(event) =>
                                        setForm({ ...form, active: event.target.checked })
                                    }
                                    className="size-4 accent-[#414b66]"
                                />
                                {ar ? "الباقة مفعّلة" : "Package Active"}
                            </label>

                            <div className="rounded-2xl border border-[#e5ded4] bg-[#f7f3ed] p-5 sm:col-span-2">
                                <div className="flex items-center gap-2 text-xs text-[#85838b]">
                                    <Coins className="size-4 text-[#a08a64]" />
                                    {ar ? "السعر النهائي بعد الخصم" : "Final Price After Discount"}
                                </div>
                                <p className="mt-2 text-2xl font-bold text-[#414b66]">
                                    {Number.isFinite(finalHalalas)
                                        ? money(finalHalalas)
                                        : "—"}
                                </p>
                            </div>

                            {formError && (
                                <p
                                    role="alert"
                                    className="rounded-xl bg-[#fff1ee] p-3 text-sm text-[#a65b51] sm:col-span-2"
                                >
                                    {formError}
                                </p>
                            )}

                            <div className="flex justify-end gap-3 border-t border-[#eee8df] pt-5 sm:col-span-2">
                                <button
                                    type="button"
                                    onClick={() => setFormOpen(false)}
                                    disabled={saveMutation.isPending}
                                    className={outline}
                                >
                                    {ar ? "إلغاء" : "Cancel"}
                                </button>
                                <button
                                    type="submit"
                                    disabled={saveMutation.isPending}
                                    className={primary}
                                >
                                    <Save className="size-4" />
                                    {saveMutation.isPending
                                        ? ar ? "جارٍ الحفظ..." : "Saving..."
                                        : ar ? "حفظ الباقة" : "Save Package"}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}

            {/* Disable Confirmation */}
            {confirmDisable && (
                <div className={overlay}>
                    <section
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="disable-package-title"
                        className={`${modal} max-w-md p-6`}
                    >
                        <div className="mb-5 inline-flex rounded-2xl bg-[#f9eae7] p-3 text-[#a65b51]">
                            <AlertTriangle className="size-6" />
                        </div>
                        <h2
                            id="disable-package-title"
                            className="text-xl font-bold text-[#292d37]"
                        >
                            {ar ? "تعطيل الباقة" : "Disable Package"}
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-[#777986]">
                            {ar
                                ? `هل تريدين تعطيل باقة «${confirmDisable.name}»؟ ستبقى في قاعدة البيانات، لكنها لن تكون متاحة للمستخدمين.`
                                : `Disable "${confirmDisable.name}"? It will remain in the database but will no longer be available to users.`}
                        </p>

                        {disableMutation.isError && (
                            <p role="alert" className="mt-4 rounded-xl bg-[#fff1ee] p-3 text-sm text-[#a65b51]">
                                {disableMutation.error instanceof Error
                                    ? disableMutation.error.message
                                    : ar ? "تعذر تعطيل الباقة" : "Could not disable package"}
                            </p>
                        )}

                        <div className="mt-7 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setConfirmDisable(null)}
                                disabled={disableMutation.isPending}
                                className={outline}
                            >
                                {ar ? "إلغاء" : "Cancel"}
                            </button>
                            <button
                                type="button"
                                disabled={disableMutation.isPending}
                                onClick={() => disableMutation.mutate(confirmDisable.id)}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#a65b51] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#91483f] disabled:opacity-50"
                            >
                                <Ban className="size-4" />
                                {disableMutation.isPending
                                    ? ar ? "جارٍ التعطيل..." : "Disabling..."
                                    : ar ? "تأكيد التعطيل" : "Confirm Disable"}
                            </button>
                        </div>
                    </section>
                </div>
            )}

            {/* Discount Modal */}
            {discountPackage && (
                <div className={overlay}>
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="discount-title"
                        className={`${modal} max-w-md p-6`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                <span className="rounded-2xl bg-[#f8efdf] p-3 text-[#a47a3b]">
                  <Percent className="size-5" />
                </span>
                                <div>
                                    <h2
                                        id="discount-title"
                                        className="text-xl font-bold text-[#292d37]"
                                    >
                                        {removeDiscount
                                            ? ar ? "إزالة الخصم" : "Remove Discount"
                                            : ar ? "إدارة خصم الباقة" : "Manage Discount"}
                                    </h2>
                                    <p className="mt-1 text-xs text-[#85838b]">
                                        {discountPackage.name}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDiscountPackage(null)}
                                disabled={discountMutation.isPending}
                                aria-label={ar ? "إغلاق" : "Close"}
                                className="rounded-lg p-2 text-[#85838b] hover:bg-[#f0ede8] disabled:opacity-50"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="mt-6 space-y-5">
                            {!removeDiscount ? (
                                <label className="block space-y-2 text-sm">
                  <span className="font-semibold text-[#414b66]">
                    {ar ? "نسبة الخصم %" : "Discount %"}
                  </span>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="1"
                                        value={discountValue}
                                        onChange={(event) => {
                                            setDiscountValue(event.target.value);
                                            setDiscountError("");
                                        }}
                                        className={field}
                                        placeholder="20"
                                    />
                                </label>
                            ) : (
                                <p className="rounded-xl bg-[#f7f3ed] p-4 text-sm leading-7 text-[#777986]">
                                    {ar
                                        ? "سيُزال الخصم وتعود الباقة إلى سعرها الأصلي."
                                        : "The discount will be removed and the original price restored."}
                                </p>
                            )}

                            {validDiscount && (
                                <div className="rounded-2xl border border-[#e5ded4] bg-[#f7f3ed] p-5">
                                    <p className="text-xs text-[#85838b]">
                                        {ar ? "السعر النهائي" : "Final Price"}
                                    </p>
                                    <p className="mt-2 text-2xl font-bold text-[#414b66]">
                                        {money(
                                            discountedPrice(
                                                discountPackage.priceHalalas,
                                                discountPercent
                                            )
                                        )}
                                    </p>
                                </div>
                            )}

                            {discountError && (
                                <p role="alert" className="rounded-xl bg-[#fff1ee] p-3 text-sm text-[#a65b51]">
                                    {discountError}
                                </p>
                            )}

                            <div className="flex justify-end gap-3 border-t border-[#eee8df] pt-5">
                                <button
                                    type="button"
                                    onClick={() => setDiscountPackage(null)}
                                    disabled={discountMutation.isPending}
                                    className={outline}
                                >
                                    {ar ? "إلغاء" : "Cancel"}
                                </button>
                                <button
                                    type="button"
                                    disabled={discountMutation.isPending || !validDiscount}
                                    onClick={() =>
                                        discountMutation.mutate({
                                            item: discountPackage,
                                            percent: discountPercent,
                                        })
                                    }
                                    className={primary}
                                >
                                    <Percent className="size-4" />
                                    {discountMutation.isPending
                                        ? ar ? "جارٍ الحفظ..." : "Saving..."
                                        : removeDiscount
                                            ? ar ? "تأكيد إزالة الخصم" : "Confirm Removal"
                                            : ar ? "حفظ الخصم" : "Save Discount"}
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </main>
    );
}
