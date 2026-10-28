
"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
    Check,
    CheckCircle2,
    Gift,
    Loader2,
    Search,
    UserRound,
    X,
    ArrowLeft,
    ShieldCheck,
    Sparkles,
} from "lucide-react";
import { adminApi, type AdminUser } from "@/lib/api/admin";

const outline =
    "inline-flex items-center justify-center gap-2 rounded-xl border border-[#ded5c7] bg-[#fffcf7] px-4 py-2.5 text-sm font-semibold text-[#414b66] transition hover:bg-[#f4f0e9] disabled:opacity-50";

const primary =
    "inline-flex items-center justify-center gap-2 rounded-xl bg-[#414b66] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#303a54] disabled:opacity-50";

export function AdminGiftCredits() {
    const ar = useLocale() === "ar";

    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [keyword, setKeyword] = useState("");
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [credits, setCredits] = useState("");
    const [confirmed, setConfirmed] = useState(false);
    const [success, setSuccess] = useState(false);
    const [operationKey, setOperationKey] = useState<string | null>(null);

    useEffect(() => {
        const timeout = setTimeout(() => setKeyword(search.trim()), 350);
        return () => clearTimeout(timeout);
    }, [search]);

    const usersQuery = useQuery({
        queryKey: ["admin-gift-users", keyword],
        queryFn: ({ signal }) =>
            keyword
                ? adminApi.searchUsers(keyword, 0, 20, signal)
                : adminApi.users(signal, 0, 20),
        enabled: open && !confirmed && !success,
        retry: false,
    });

    const mutation = useMutation({
        mutationFn: ({
                         userId,
                         amount,
                         key,
                     }: {
            userId: number;
            amount: number;
            key: string;
        }) => adminApi.giftCredits(userId, amount, key),
        onSuccess: () => {
            setSuccess(true);
            setConfirmed(false);
            setOperationKey(null);
        },
    });

    const amount = Number(credits);
    const validAmount =
        credits.trim() !== "" &&
        Number.isSafeInteger(amount) &&
        amount > 0 &&
        amount <= 100000;

    const canContinue =
        selectedUser !== null &&
        selectedUser.active &&
        !selectedUser.suspendedByAdmin &&
        validAmount;

    const close = () => {
        if (mutation.isPending) return;
        setOpen(false);
        setSearch("");
        setKeyword("");
        setSelectedUser(null);
        setCredits("");
        setConfirmed(false);
        setSuccess(false);
        setOperationKey(null);
        mutation.reset();
    };

    const chooseUser = (user: AdminUser) => {
        setSelectedUser(user);
        setSearch("");
        setKeyword("");
        setOperationKey(null);
        mutation.reset();
    };

    const submit = () => {
        if (!selectedUser || !canContinue || mutation.isPending) return;

        if (!confirmed) {
            setConfirmed(true);
            return;
        }

        const key = operationKey ?? crypto.randomUUID();
        setOperationKey(key);
        mutation.mutate({ userId: selectedUser.id, amount, key });
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d9d2c8] bg-[#fffcf7] px-5 py-2.5 text-sm font-semibold text-[#414b66] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#f4f0e9]"
            >
                <Gift className="size-4" />
                {ar ? "منح أرصدة" : "Gift Credits"}
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1d2333]/60 p-4 backdrop-blur-sm">
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="gift-credits-title"
                        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[28px] border border-[#e3dacf] bg-[#fffcf7] shadow-2xl"
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-[#eee8df] p-6">
                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl bg-[#eceaf0] p-3 text-[#414b66]">
                                    <Gift className="size-6" />
                                </div>
                                <div>
                                    <p className="mb-1 text-xs font-medium text-[#85838b]">
                                        {ar ? "إدارة الأرصدة" : "Credit Management"}
                                    </p>
                                    <h2
                                        id="gift-credits-title"
                                        className="text-xl font-bold text-[#292d37]"
                                    >
                                        {ar ? "منح أرصدة لمستخدم" : "Gift User Credits"}
                                    </h2>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={close}
                                disabled={mutation.isPending}
                                aria-label={ar ? "إغلاق" : "Close"}
                                className="rounded-lg p-2 text-[#85838b] transition hover:bg-[#f0ede8] disabled:opacity-50"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            {success ? (
                                <div className="space-y-5 py-5 text-center">
                                    <div className="mx-auto grid size-20 place-items-center rounded-full bg-[#e7f1e9] text-[#477554]">
                                        <CheckCircle2 className="size-10" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-[#292d37]">
                                            {ar
                                                ? "تم منح الأرصدة بنجاح"
                                                : "Credits Gifted Successfully"}
                                        </h3>
                                        <p className="mt-3 text-sm leading-7 text-[#777986]">
                                            {ar
                                                ? `تمت إضافة ${amount} رصيد إلى حساب ${selectedUser?.fullName}.`
                                                : `${amount} credits were added to ${selectedUser?.fullName}.`}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-[#f7f3ed] p-5">
                                        <p className="text-xs text-[#85838b]">
                                            {ar ? "الأرصدة الممنوحة" : "Gifted Credits"}
                                        </p>
                                        <p className="mt-2 text-3xl font-bold text-[#414b66]">
                                            +{amount}
                                        </p>
                                    </div>
                                    <button type="button" onClick={close} className={`${primary} w-full`}>
                                        {ar ? "إغلاق" : "Close"}
                                    </button>
                                </div>
                            ) : (
                                <form
                                    className="space-y-5"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        submit();
                                    }}
                                >
                                    <div className="flex items-center gap-2 text-xs text-[#777986]">
                    <span
                        className={`rounded-full px-3 py-1.5 ${
                            !confirmed
                                ? "bg-[#414b66] text-white"
                                : "bg-[#e7f1e9] text-[#477554]"
                        }`}
                    >
                      {ar ? "١. البيانات" : "1. Details"}
                    </span>
                                        <span className="h-px flex-1 bg-[#e5ded4]" />
                                        <span
                                            className={`rounded-full px-3 py-1.5 ${
                                                confirmed
                                                    ? "bg-[#414b66] text-white"
                                                    : "bg-[#f0ede8] text-[#85838b]"
                                            }`}
                                        >
                      {ar ? "٢. التأكيد" : "2. Confirm"}
                    </span>
                                    </div>

                                    {!confirmed ? (
                                        <>
                                            <p className="text-sm leading-7 text-[#85838b]">
                                                {ar
                                                    ? "اختاري حساب المستخدم وحددي عدد الأرصدة التي ترغبين في إضافتها."
                                                    : "Choose a user and enter the number of credits."}
                                            </p>

                                            <div className="space-y-3">
                                                <label className="block text-sm font-semibold text-[#414b66]">
                                                    {ar ? "المستخدم المستفيد" : "Recipient"}
                                                </label>

                                                {selectedUser ? (
                                                    <div className="flex items-center gap-3 rounded-2xl border border-[#cbd8ce] bg-[#f0f6f0] p-4">
                                                        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-[#477554]">
                                                            <UserRound className="size-5" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-bold text-[#292d37]">
                                                                {selectedUser.fullName}
                                                            </p>
                                                            <bdi className="block truncate text-xs text-[#777986]">
                                                                {selectedUser.email}
                                                            </bdi>
                                                        </div>
                                                        <Check className="size-4 shrink-0 text-[#477554]" />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedUser(null);
                                                                setOperationKey(null);
                                                                mutation.reset();
                                                            }}
                                                            className="text-xs font-semibold text-[#414b66] underline underline-offset-4"
                                                        >
                                                            {ar ? "تغيير" : "Change"}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="relative">
                                                            <Search className="absolute start-4 top-1/2 size-4 -translate-y-1/2 text-[#92909a]" />
                                                            <input
                                                                value={search}
                                                                onChange={(event) => setSearch(event.target.value)}
                                                                placeholder={
                                                                    ar
                                                                        ? "ابحثي بالاسم أو البريد الإلكتروني..."
                                                                        : "Search name or email..."
                                                                }
                                                                className="h-12 w-full rounded-xl border border-[#ded5c7] bg-[#faf8f4] ps-11 pe-4 text-sm text-[#292d37] outline-none focus:border-[#77809a]"
                                                            />
                                                        </div>

                                                        <div className="max-h-56 overflow-y-auto rounded-2xl border border-[#e5ded4] bg-white">
                                                            {usersQuery.isPending || usersQuery.isFetching ? (
                                                                <div className="flex items-center justify-center gap-2 p-6 text-sm text-[#85838b]">
                                                                    <Loader2 className="size-4 animate-spin" />
                                                                    {ar ? "جارٍ البحث..." : "Searching..."}
                                                                </div>
                                                            ) : usersQuery.isError ? (
                                                                <div className="space-y-3 p-5 text-center">
                                                                    <p className="text-sm text-[#a65b51]">
                                                                        {ar
                                                                            ? "تعذر تحميل المستخدمين"
                                                                            : "Could not load users"}
                                                                    </p>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => void usersQuery.refetch()}
                                                                        className={outline}
                                                                    >
                                                                        {ar ? "إعادة المحاولة" : "Retry"}
                                                                    </button>
                                                                </div>
                                                            ) : usersQuery.data?.content.length === 0 ? (
                                                                <p className="p-6 text-center text-sm text-[#85838b]">
                                                                    {ar ? "لا توجد نتائج مطابقة" : "No matching users"}
                                                                </p>
                                                            ) : (
                                                                usersQuery.data?.content.map((user) => {
                                                                    const available =
                                                                        user.active && !user.suspendedByAdmin;
                                                                    return (
                                                                        <button
                                                                            key={user.id}
                                                                            type="button"
                                                                            disabled={!available}
                                                                            onClick={() => chooseUser(user)}
                                                                            className="flex w-full items-center gap-3 border-b border-[#eee8df] p-3 text-start transition hover:bg-[#faf7f1] last:border-0 disabled:cursor-not-allowed disabled:opacity-50"
                                                                        >
                                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f0ede8] text-[#414b66]">
                                        <UserRound className="size-4" />
                                      </span>
                                                                            <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-semibold text-[#292d37]">
                                          {user.fullName}
                                        </span>
                                        <bdi className="block truncate text-xs text-[#85838b]">
                                          {user.email}
                                        </bdi>
                                      </span>
                                                                            {!available && (
                                                                                <span className="text-xs text-[#a65b51]">
                                          {ar ? "غير متاح" : "Unavailable"}
                                        </span>
                                                                            )}
                                                                        </button>
                                                                    );
                                                                })
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            <label className="block space-y-2">
                        <span className="text-sm font-semibold text-[#414b66]">
                          {ar ? "عدد الأرصدة" : "Credit Amount"}
                        </span>
                                                <input
                                                    required
                                                    type="number"
                                                    min="1"
                                                    max="100000"
                                                    step="1"
                                                    value={credits}
                                                    onChange={(event) => {
                                                        setCredits(event.target.value);
                                                        setOperationKey(null);
                                                        mutation.reset();
                                                    }}
                                                    placeholder="50"
                                                    className="h-12 w-full rounded-xl border border-[#ded5c7] bg-[#faf8f4] px-4 text-sm text-[#292d37] outline-none focus:border-[#77809a]"
                                                />
                                                <span className="block text-xs text-[#92909a]">
                          {ar
                              ? "يمكن منح من 1 إلى 100,000 رصيد في العملية."
                              : "Gift between 1 and 100,000 credits."}
                        </span>
                                            </label>
                                        </>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="rounded-2xl border border-[#e5ded4] bg-[#f8f4ee] p-5">
                                                <div className="mb-4 flex items-center gap-2">
                                                    <ShieldCheck className="size-5 text-[#414b66]" />
                                                    <h3 className="font-bold text-[#292d37]">
                                                        {ar ? "مراجعة عملية المنح" : "Review Gift"}
                                                    </h3>
                                                </div>
                                                <div className="space-y-4 text-sm">
                                                    <div className="flex justify-between gap-3">
                            <span className="text-[#85838b]">
                              {ar ? "المستخدم" : "User"}
                            </span>
                                                        <span className="font-semibold text-[#292d37]">
                              {selectedUser?.fullName}
                            </span>
                                                    </div>
                                                    <div className="flex flex-wrap justify-between gap-3">
                            <span className="text-[#85838b]">
                              {ar ? "البريد" : "Email"}
                            </span>
                                                        <bdi className="break-all text-end text-[#414b66]">
                                                            {selectedUser?.email}
                                                        </bdi>
                                                    </div>
                                                    <div className="flex items-center justify-between border-t border-[#e5ded4] pt-4">
                            <span className="text-[#85838b]">
                              {ar ? "الأرصدة" : "Credits"}
                            </span>
                                                        <span className="text-2xl font-bold text-[#414b66]">
                              +{amount}
                            </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="flex items-start gap-2 text-xs leading-6 text-[#85838b]">
                                                <Sparkles className="mt-1 size-4 shrink-0 text-[#a08a64]" />
                                                {ar
                                                    ? "ستُضاف الأرصدة مباشرة إلى حساب المستخدم بعد التأكيد."
                                                    : "Credits will be added to the user's account after confirmation."}
                                            </p>
                                        </div>
                                    )}

                                    {mutation.isError && (
                                        <p role="alert" className="rounded-xl bg-[#fff1ee] p-3 text-sm text-[#a65b51]">
                                            {mutation.error instanceof Error
                                                ? mutation.error.message
                                                : ar
                                                    ? "تعذر منح الأرصدة"
                                                    : "Failed to gift credits"}
                                        </p>
                                    )}

                                    <div className="flex justify-end gap-3 border-t border-[#eee8df] pt-5">
                                        <button
                                            type="button"
                                            disabled={mutation.isPending}
                                            onClick={() => {
                                                if (confirmed) {
                                                    setConfirmed(false);
                                                    mutation.reset();
                                                } else {
                                                    close();
                                                }
                                            }}
                                            className={outline}
                                        >
                                            {confirmed
                                                ? ar ? "رجوع" : "Back"
                                                : ar ? "إلغاء" : "Cancel"}
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!canContinue || mutation.isPending}
                                            className={primary}
                                        >
                                            {mutation.isPending ? (
                                                <>
                                                    <Loader2 className="size-4 animate-spin" />
                                                    {ar ? "جارٍ التنفيذ..." : "Processing..."}
                                                </>
                                            ) : confirmed ? (
                                                <>
                                                    <Gift className="size-4" />
                                                    {ar ? "تأكيد المنح" : "Confirm Gift"}
                                                </>
                                            ) : (
                                                <>
                                                    {ar ? "متابعة" : "Continue"}
                                                    <ArrowLeft className="size-4" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </section>
                </div>
            )}
        </>
    );
}
