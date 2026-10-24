"use client";
import { formatTimestamp } from "@/features/product/presentation";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from "@/components/ui/select";
import { Field, FieldLabel } from "@/components/ui/field";
import { getProductCopy } from "@/features/product/presentation-copy";
import { QueryFeedback } from "@/components/product/query-feedback";
import { PaymentHistorySkeleton, PaymentVerificationSkeleton, SummarySkeleton } from "@/components/product/page-skeleton";
import { useLocale } from "next-intl";
import { getLayoutCopy } from "@/components/layout/copy";
import { Badge } from "@/components/ui/badge";
import { useState, useSyncExternalStore } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useIdentity } from "@/features/account/identity";
import { payments } from "@/lib/api/payments";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { Payment } from "@/lib/api/discovery-contracts";
import { CommutePanel } from "./commute-panel";
import { validCoordinates } from "@/lib/maps/points";
const statuses: Record<string, string> = { PENDING: "قيد التأكيد", PAID: "مدفوع", FAILED: "فشل / انتهت المحاولة", REFUNDED: "مسترد — الوصول ملغى" };
export function PaymentsPage() {
  const locale = useLocale(); const copy = getLayoutCopy(locale); const ar = locale === "ar"; const paymentLabel = (status: string) => ar ? statuses[status] : ({ PENDING: "Pending", PAID: "Paid", FAILED: "Failed / expired", REFUNDED: "Refunded — access revoked" }[status] || status); const { userId } = useIdentity(); const cache = useQueryClient(); const [status, setStatus] = useState(""); const [verified, setVerified] = useState<Payment | null>(null);
  const query = useQuery({ queryKey: ["payments", userId, status], queryFn: ({ signal }) => payments.history(userId, status || undefined, signal), retry: false });
  const verify = useMutation({ mutationFn: (id: number) => payments.verify(userId, id), onMutate: () => setVerified(null), onSuccess: async data => { setVerified(data); await Promise.all([cache.invalidateQueries({ queryKey: ["payments", userId] }), cache.invalidateQueries({ queryKey: ["access", userId] })]); } });
  return <div className="flex max-w-5xl flex-col gap-5"><PageHeading title={copy.paymentsTitle} description={copy.paymentsDescription} />
    <Field className="max-w-xs"><FieldLabel htmlFor="payment-filter">{copy.paymentStatus}</FieldLabel><Select items={[{ value: "", label: copy.allStatuses }, ...Object.keys(statuses).map(value => ({ value: value.toLowerCase(), label: paymentLabel(value) }))]} value={status} onValueChange={value => { setStatus(value || ""); setVerified(null); verify.reset(); }}><SelectTrigger id="payment-filter" className="h-11 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="">{copy.allStatuses}</SelectItem>{Object.keys(statuses).map(value => <SelectItem key={value} value={value.toLowerCase()}>{paymentLabel(value)}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
    <QueryFeedback query={query} />{query.isPending ? <PaymentHistorySkeleton /> : query.isError && !query.data?.length ? <ErrorState error={query.error} retry={() => void query.refetch()} /> : !query.data.length ? <EmptyState title={copy.noPayments} description={copy.noPaymentsHint} /> : query.data.map(item => <article key={item.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/70 bg-card p-5"><div><div className="flex flex-wrap items-center gap-3"><h2 className="text-sm font-semibold">{ar ? "تحليل التنقل" : "Commute analysis"}</h2><Badge variant="secondary" className="rounded-md font-normal">{paymentLabel(item.status)}</Badge></div><p className="my-2 text-lg font-semibold tabular-nums">{item.currency ? `${new Intl.NumberFormat(locale).format(item.amount / 100)} ${item.currency}` : ar ? "العملة غير متاحة" : "Currency unavailable"}</p><p className="text-xs text-muted-foreground">{formatTimestamp(item.createdAt, locale)}</p><details className="mt-2 text-xs text-muted-foreground"><summary className="cursor-pointer py-1">{ar ? "تفاصيل العملية" : "Payment details"}</summary><p className="mt-2">{ar ? "العملية" : "Payment"} #{item.id} · {ar ? "الصلاحية" : "Expires"}: <bdi>{formatTimestamp(item.accessExpiresAt, locale)}</bdi></p></details></div><Button variant="outline" disabled={verify.isPending} onClick={() => verify.mutate(item.id)}>{verify.isPending && verify.variables === item.id ? copy.verifying : copy.verify}</Button></article>)}
    {verify.isError ? <ErrorState error={verify.error} /> : null}{verified ? <p role="status">{ar ? "الحالة المؤكدة للعملية" : "Verified payment status"} #{verified.id}: {paymentLabel(verified.status)}</p> : null}
    {verified?.status === "FAILED" ? <Button variant="outline" onClick={() => { sessionStorage.removeItem(`madar-checkout-key:${userId}`); setVerified(null); }}>{ar ? "السماح بمحاولة دفع جديدة" : "Allow a new payment attempt"}</Button> : null}
  </div>;
}
const subscribe = () => () => {};
export function PaymentReturn() {
  const locale = useLocale(); const text = getProductCopy(locale); const statusLabel = (status: string) => ({ PENDING: text.pending, PAID: text.paid, FAILED: text.failed, REFUNDED: text.refunded }[status] || status);
  const { userId } = useIdentity();
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  const localId = useSyncExternalStore(subscribe, () => { try { return sessionStorage.getItem(`madar-payment:${userId}`); } catch { return null; } }, () => null);
  const origin = useSyncExternalStore(subscribe, () => { try { return sessionStorage.getItem(`madar-payment-origin:${userId}`); } catch { return null; } }, () => null);
  const id = localId && /^\d+$/.test(localId) && Number(localId) > 0 && Number(localId) <= 2147483647 ? Number(localId) : null;
  const verification = useQuery({ queryKey: ["payment-verification", userId, id], queryFn: ({ signal }) => payments.verify(userId, id!, signal), enabled: id !== null, staleTime: 0, retry: false });
  const access = useQuery({ queryKey: ["access-after-verify", userId, verification.dataUpdatedAt], queryFn: ({ signal }) => payments.access(userId, signal), enabled: verification.isSuccess, staleTime: 0, retry: false });
  let coordinates: { latitude: number; longitude: number } | null = null;
  try { const parsed = JSON.parse(origin || "null"); if (parsed && validCoordinates(parsed.latitude, parsed.longitude)) coordinates = parsed; } catch { /* optional return context */ }
  return <div className="flex max-w-3xl flex-col gap-5"><PageHeading title={text.paymentReturn} description={text.paymentReturnHint} />
    {!ready ? <PaymentVerificationSkeleton /> : !id ? <EmptyState title={text.noSession} description={text.noSessionHint}><Button nativeButton={false} render={<Link href="/payments" />}>{text.paymentHistory}</Button></EmptyState> : verification.isPending ? <PaymentVerificationSkeleton /> : verification.isError ? <ErrorState error={verification.error} retry={() => void verification.refetch()} retryDisabled={verification.isFetching} /> : <>
      <p role="status" className="rounded-2xl border border-border/70 bg-card p-5">{statusLabel(verification.data.status)}{verification.data.status === "PENDING" ? ` — ${text.pendingPayment}` : ""}</p>
      {verification.isFetching || access.isPending || access.isFetching ? <><p role="status">{text.checkingAccess}</p><SummarySkeleton /></> : access.isError ? <ErrorState error={access.error} retry={() => void access.refetch()} retryDisabled={access.isFetching} /> : access.data?.access ? <><p className="text-primary">{text.accessUntil} <bdi>{formatTimestamp(access.data.expiresAt, locale)}</bdi>.</p>{coordinates ? <CommutePanel {...coordinates} /> : null}</> : <p>{text.noAccess}</p>}
      <Button className="self-start" disabled={verification.isFetching} onClick={() => void verification.refetch()}>{text.verifyAgain}</Button>
    </>}
  </div>;
}
