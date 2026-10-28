
"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  UsersRound,
  ShieldCheck,
  Ban,
  CheckCircle2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  UserRoundCheck,
  UserRoundX,
  X,
  AlertTriangle,
  UserRound,
  SlidersHorizontal,
} from "lucide-react";
import { useIdentity } from "@/features/account/identity";
import { adminApi, type AdminUser } from "@/lib/api/admin";
import { ErrorState } from "@/components/shared/error-state";
import { MadarLoader } from "@/components/branding/madar-loader";

type Action = "suspend" | "unsuspend" | "delete";
type Filter = "all" | "active" | "suspended";

const card =
    "rounded-[26px] border border-[#ded5c7] bg-[#fffcf7] shadow-sm";

const outlineButton =
    "inline-flex items-center justify-center gap-2 rounded-xl border border-[#ddd5ca] bg-[#fffcf7] px-4 py-2.5 text-sm font-semibold text-[#414b66] transition-all hover:border-[#a7a5b1] hover:bg-[#f4f0e9] disabled:cursor-not-allowed disabled:opacity-50";

const navyButton =
    "inline-flex items-center justify-center gap-2 rounded-xl bg-[#414b66] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#303a54] disabled:cursor-not-allowed disabled:opacity-50";

function UserStatus({
                      user,
                      ar,
                    }: {
  user: AdminUser;
  ar: boolean;
}) {
  const suspended = user.suspendedByAdmin;
  const active = user.active && !suspended;

  return (
      <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
              suspended
                  ? "bg-[#f9eae7] text-[#a65b51]"
                  : active
                      ? "bg-[#e7f1e9] text-[#477554]"
                      : "bg-[#f0ece6] text-[#81796e]"
          }`}
      >
      <span
          className={`size-1.5 rounded-full ${
              suspended
                  ? "bg-[#b96d63]"
                  : active
                      ? "bg-[#5c9168]"
                      : "bg-[#a49b8e]"
          }`}
      />
        {suspended
            ? ar
                ? "موقوف"
                : "Suspended"
            : active
                ? ar
                    ? "نشط"
                    : "Active"
                : ar
                    ? "غير نشط"
                    : "Inactive"}
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
  value: number | string;
  note: string;
  icon: typeof UsersRound;
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

export function AdminUsers() {
  const ar = useLocale() === "ar";
  const { userId } = useIdentity();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [pendingAction, setPendingAction] = useState<{
    user: AdminUser;
    action: Action;
  } | null>(null);
  const [actionError, setActionError] = useState("");

  const query = useQuery({
    queryKey: ["admin-users", userId, page],
    queryFn: ({ signal }) => adminApi.users(signal, page, 10),
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: async ({
                         id,
                         action,
                       }: {
      id: number;
      action: Action;
    }) => {
      if (action === "suspend") return adminApi.suspend(id);
      if (action === "unsuspend") return adminApi.unsuspend(id);
      return adminApi.removeUser(id);
    },
    onSuccess: async () => {
      setPendingAction(null);
      setActionError("");
      await queryClient.invalidateQueries({
        queryKey: ["admin-users"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["admin-overview-users"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["admin", "dashboard"],
      });
    },
    onError: (error) => {
      setActionError(
          error instanceof Error
              ? error.message
              : ar
                  ? "تعذّر تنفيذ العملية"
                  : "Action failed"
      );
    },
  });

  const users = useMemo(() => {
    const content = query.data?.content ?? [];
    const keyword = search.trim().toLowerCase();

    return content.filter((user) => {
      const matchesSearch =
          !keyword ||
          user.fullName.toLowerCase().includes(keyword) ||
          user.email.toLowerCase().includes(keyword) ||
          String(user.id).includes(keyword);

      const matchesFilter =
          filter === "all" ||
          (filter === "active" &&
              user.active &&
              !user.suspendedByAdmin) ||
          (filter === "suspended" && user.suspendedByAdmin);

      return matchesSearch && matchesFilter;
    });
  }, [query.data, search, filter]);

  const currentPageUsers = query.data?.content ?? [];
  const activeOnPage = currentPageUsers.filter(
      (user) => user.active && !user.suspendedByAdmin
  ).length;
  const suspendedOnPage = currentPageUsers.filter(
      (user) => user.suspendedByAdmin
  ).length;

  const actionName = (action: Action) => {
    if (action === "suspend")
      return ar ? "إيقاف الحساب" : "Suspend Account";
    if (action === "unsuspend")
      return ar ? "إلغاء الإيقاف" : "Unsuspend Account";
    return ar ? "حذف الحساب" : "Delete Account";
  };

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
                {ar
                    ? "إدارة مدار / المستخدمون"
                    : "MADAR / Users"}
              </span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                {ar ? "إدارة المستخدمين" : "User Management"}
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-white/75">
                {ar
                    ? "إدارة حسابات المنصة ومتابعة حالتها والتحكم في إجراءات الإيقاف وإعادة التفعيل."
                    : "Manage platform accounts, review their status and control account access."}
              </p>

              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs text-white/90">
                <UsersRound className="size-4" />
                {ar ? "إدارة الحسابات" : "Account Administration"}
              </div>
            </div>

            <button
                type="button"
                onClick={() => void query.refetch()}
                disabled={query.isFetching}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/20 disabled:opacity-50"
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
              {ar ? "ملخص الحسابات" : "Account Overview"}
            </h2>
            <p className="mt-1 text-sm text-[#85838b]">
              {ar
                  ? "نظرة سريعة على المستخدمين المسجلين"
                  : "A quick overview of registered accounts"}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <SummaryCard
                label={ar ? "إجمالي المستخدمين" : "Total Users"}
                value={query.data?.totalElements ?? "—"}
                note={ar ? "جميع الحسابات المسجلة" : "All registered accounts"}
                icon={UsersRound}
            />

            <SummaryCard
                label={ar ? "الحسابات النشطة" : "Active Accounts"}
                value={query.isPending ? "—" : activeOnPage}
                note={
                  ar
                      ? "ضمن الصفحة الحالية"
                      : "On the current page"
                }
                icon={UserRoundCheck}
            />

            <SummaryCard
                label={ar ? "الحسابات الموقوفة" : "Suspended Accounts"}
                value={query.isPending ? "—" : suspendedOnPage}
                note={
                  ar
                      ? "ضمن الصفحة الحالية"
                      : "On the current page"
                }
                icon={UserRoundX}
            />
          </div>
        </section>

        {/* User list */}
        <section className={`${card} overflow-hidden`}>
          <div className="border-b border-[#e8e1d7] p-5 md:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#292d37]">
                  {ar ? "قائمة المستخدمين" : "Users List"}
                </h2>
                <p className="mt-1 text-xs text-[#85838b]">
                  {ar
                      ? "استعراض الحسابات وإدارة إجراءاتها"
                      : "Browse and manage user accounts"}
                </p>
              </div>

              <span className="rounded-full bg-[#f0ede8] px-3 py-1.5 text-xs font-medium text-[#47516d]">
              {query.data?.totalElements ?? 0}{" "}
                {ar ? "مستخدم" : "Users"}
            </span>
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute start-4 top-1/2 size-4 -translate-y-1/2 text-[#92909a]" />

                <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={
                      ar
                          ? "ابحث بالاسم أو البريد الإلكتروني أو رقم المستخدم..."
                          : "Search by name, email, or user ID..."
                    }
                    className="h-12 w-full rounded-xl border border-[#e0d8cd] bg-[#faf8f4] ps-11 pe-10 text-sm text-[#292d37] outline-none transition focus:border-[#77809a] focus:ring-2 focus:ring-[#77809a]/10"
                />

                {search && (
                    <button
                        type="button"
                        onClick={() => setSearch("")}
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-[#92909a] hover:text-[#414b66]"
                        aria-label={ar ? "مسح البحث" : "Clear search"}
                    >
                      <X className="size-4" />
                    </button>
                )}
              </div>

              <div className="relative">
                <SlidersHorizontal className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-[#777986]" />
                <select
                    value={filter}
                    onChange={(event) =>
                        setFilter(event.target.value as Filter)
                    }
                    aria-label={ar ? "تصفية الحسابات" : "Filter accounts"}
                    className="h-12 min-w-44 appearance-none rounded-xl border border-[#e0d8cd] bg-[#faf8f4] ps-11 pe-8 text-sm text-[#414b66] outline-none transition focus:border-[#77809a]"
                >
                  <option value="all">
                    {ar ? "كل الحالات" : "All Statuses"}
                  </option>
                  <option value="active">
                    {ar ? "الحسابات النشطة" : "Active"}
                  </option>
                  <option value="suspended">
                    {ar ? "الحسابات الموقوفة" : "Suspended"}
                  </option>
                </select>
              </div>
            </div>

            {(search || filter !== "all") && (
                <p className="mt-3 text-xs text-[#85838b]">
                  {ar
                      ? `نتائج البحث في الصفحة الحالية: ${users.length}`
                      : `Results on current page: ${users.length}`}
                </p>
            )}
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
                  <table className="w-full min-w-[760px] text-sm">
                    <thead className="bg-[#f7f3ed] text-[#777986]">
                    <tr>
                      <th className="px-6 py-4 text-start text-xs font-semibold">
                        {ar ? "المستخدم" : "User"}
                      </th>
                      <th className="px-6 py-4 text-start text-xs font-semibold">
                        {ar ? "الصلاحية" : "Role"}
                      </th>
                      <th className="px-6 py-4 text-start text-xs font-semibold">
                        {ar ? "حالة الحساب" : "Account Status"}
                      </th>
                      <th className="px-6 py-4 text-start text-xs font-semibold">
                        {ar ? "الإجراءات" : "Actions"}
                      </th>
                    </tr>
                    </thead>

                    <tbody>
                    {users.map((user) => {
                      const isSelf = user.id === userId;
                      const isAdmin = user.role === "ADMIN";

                      return (
                          <tr
                              key={user.id}
                              className="border-t border-[#eee8df] transition-colors hover:bg-[#faf7f1]"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#e9e7eb] text-base font-bold text-[#47516d]">
                              {user.fullName?.charAt(0) || (
                                  <UserRound className="size-5" />
                              )}
                            </span>

                                <div className="min-w-0">
                                  <p className="font-semibold text-[#292d37]">
                                    {user.fullName}
                                  </p>

                                  <bdi className="mt-1 block text-xs text-[#85838b]">
                                    {user.email}
                                  </bdi>

                                  <span className="mt-1 block text-[11px] text-[#a19ca1]">
                                ID: {user.id}
                              </span>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e4ded6] bg-[#f5f1eb] px-3 py-1.5 text-xs font-medium text-[#666a77]">
                            {isAdmin && (
                                <ShieldCheck className="size-3.5" />
                            )}
                            {isAdmin
                                ? ar
                                    ? "مسؤول"
                                    : "Admin"
                                : ar
                                    ? "مستخدم"
                                    : "User"}
                          </span>
                            </td>

                            <td className="px-6 py-4">
                              <UserStatus user={user} ar={ar} />
                            </td>

                            <td className="px-6 py-4">
                              {isSelf || isAdmin ? (
                                  <span className="text-xs text-[#92909a]">
                              {isSelf
                                  ? ar
                                      ? "حسابك الحالي"
                                      : "Your account"
                                  : ar
                                      ? "حساب إداري"
                                      : "Admin account"}
                            </span>
                              ) : (
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                          setActionError("");
                                          setPendingAction({
                                            user,
                                            action: user.suspendedByAdmin
                                                ? "unsuspend"
                                                : "suspend",
                                          });
                                        }}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#ded7cd] bg-white px-3 py-2 text-xs font-semibold text-[#414b66] transition hover:border-[#9ca4b5] hover:bg-[#f2f0ed]"
                                    >
                                      {user.suspendedByAdmin ? (
                                          <CheckCircle2 className="size-3.5" />
                                      ) : (
                                          <Ban className="size-3.5" />
                                      )}

                                      {user.suspendedByAdmin
                                          ? ar
                                              ? "إلغاء الإيقاف"
                                              : "Unsuspend"
                                          : ar
                                              ? "إيقاف"
                                              : "Suspend"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                          setActionError("");
                                          setPendingAction({
                                            user,
                                            action: "delete",
                                          });
                                        }}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#f0d9d5] bg-[#fff8f7] px-3 py-2 text-xs font-semibold text-[#a65b51] transition hover:bg-[#fbece9]"
                                    >
                                      <Trash2 className="size-3.5" />
                                      {ar ? "حذف" : "Delete"}
                                    </button>
                                  </div>
                              )}
                            </td>
                          </tr>
                      );
                    })}
                    </tbody>
                  </table>

                  {users.length === 0 && (
                      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                        <div className="mb-4 rounded-2xl bg-[#f0ede8] p-4 text-[#85838b]">
                          <Search className="size-6" />
                        </div>
                        <h3 className="font-semibold text-[#414b66]">
                          {ar ? "لا توجد نتائج مطابقة" : "No matching results"}
                        </h3>
                        <p className="mt-2 text-sm text-[#92909a]">
                          {ar
                              ? "جربي تغيير البحث أو التصفية."
                              : "Try adjusting your search or filters."}
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

        {/* Confirmation dialog */}
        {pendingAction && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1d2333]/60 p-4 backdrop-blur-sm">
              <div
                  role="alertdialog"
                  aria-modal="true"
                  aria-labelledby="admin-confirm-title"
                  aria-describedby="admin-confirm-description"
                  className="w-full max-w-md overflow-hidden rounded-[26px] border border-[#e3dacf] bg-[#fffcf7] shadow-2xl"
              >
                <div className="p-7">
                  <div className="mb-5 flex items-start justify-between gap-4">
                <span
                    className={`rounded-2xl p-3 ${
                        pendingAction.action === "delete"
                            ? "bg-[#f9eae7] text-[#a65b51]"
                            : "bg-[#eeedf1] text-[#47516d]"
                    }`}
                >
                  {pendingAction.action === "delete" ? (
                      <AlertTriangle className="size-6" />
                  ) : pendingAction.action === "suspend" ? (
                      <Ban className="size-6" />
                  ) : (
                      <CheckCircle2 className="size-6" />
                  )}
                </span>

                    <button
                        type="button"
                        disabled={mutation.isPending}
                        onClick={() => {
                          setPendingAction(null);
                          setActionError("");
                        }}
                        className="rounded-lg p-2 text-[#85838b] transition hover:bg-[#f0ede8]"
                        aria-label={ar ? "إغلاق" : "Close"}
                    >
                      <X className="size-5" />
                    </button>
                  </div>

                  <h2
                      id="admin-confirm-title"
                      className="text-xl font-bold text-[#292d37]"
                  >
                    {actionName(pendingAction.action)}
                  </h2>

                  <p
                      id="admin-confirm-description"
                      className="mt-3 text-sm leading-7 text-[#777986]"
                  >
                    {ar
                        ? `هل أنت متأكد من ${actionName(
                            pendingAction.action
                        )} للمستخدم ${pendingAction.user.fullName}؟`
                        : `Are you sure you want to ${pendingAction.action} ${pendingAction.user.fullName}?`}
                  </p>

                  <div className="mt-5 rounded-xl border border-[#e8e1d7] bg-[#f8f4ee] p-4">
                    <p className="text-sm font-semibold text-[#414b66]">
                      {pendingAction.user.fullName}
                    </p>
                    <bdi className="mt-1 block text-xs text-[#85838b]">
                      {pendingAction.user.email}
                    </bdi>
                  </div>

                  {pendingAction.action === "delete" && (
                      <p className="mt-4 flex items-start gap-2 rounded-xl bg-[#fff1ee] p-3 text-xs leading-6 text-[#a65b51]">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        {ar
                            ? "تنبيه: قد يكون حذف الحساب نهائيًا وغير قابل للتراجع."
                            : "Warning: Account deletion may be irreversible."}
                      </p>
                  )}

                  {actionError && (
                      <p
                          role="alert"
                          className="mt-4 rounded-xl bg-[#fff1ee] p-3 text-sm text-[#a65b51]"
                      >
                        {actionError}
                      </p>
                  )}

                  <div className="mt-7 flex justify-end gap-3">
                    <button
                        type="button"
                        disabled={mutation.isPending}
                        onClick={() => {
                          setPendingAction(null);
                          setActionError("");
                        }}
                        className={outlineButton}
                    >
                      {ar ? "إلغاء" : "Cancel"}
                    </button>

                    <button
                        type="button"
                        disabled={mutation.isPending}
                        onClick={() =>
                            mutation.mutate({
                              id: pendingAction.user.id,
                              action: pendingAction.action,
                            })
                        }
                        className={
                          pendingAction.action === "delete"
                              ? "inline-flex items-center justify-center gap-2 rounded-xl bg-[#a65b51] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#91483f] disabled:opacity-50"
                              : navyButton
                        }
                    >
                      {mutation.isPending
                          ? ar
                              ? "جارٍ التنفيذ..."
                              : "Processing..."
                          : actionName(pendingAction.action)}
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}
      </main>
  );
}
