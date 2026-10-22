"use client";
import { useState, useSyncExternalStore } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useIdentity } from "@/features/product/identity";
import { payments } from "@/lib/api/discovery";
import { ErrorState, Loading, EmptyState, PageHeading } from "@/features/product/shared";
import { Button } from "@/components/ui/button";
import type { Payment } from "@/lib/api/discovery-contracts";
import { CommutePanel } from "./commute-panel";
import { validCoordinates } from "@/components/maps/google-map";
const statuses: Record<string, string> = { PENDING: "قيد التأكيد", PAID: "مدفوع", FAILED: "فشل / انتهت المحاولة", REFUNDED: "مسترد — الوصول ملغى" };
export function PaymentsPage() {
  const { userId } = useIdentity(); const cache = useQueryClient(); const [status, setStatus] = useState(""); const [verified, setVerified] = useState<Payment | null>(null);
  const query = useQuery({ queryKey: ["payments", userId, status], queryFn: ({ signal }) => payments.history(userId, status || undefined, signal), retry: false });
  const verify = useMutation({ mutationFn: (id: number) => payments.verify(userId, id), onMutate: () => setVerified(null), onSuccess: async data => { setVerified(data); await Promise.all([cache.invalidateQueries({ queryKey: ["payments", userId] }), cache.invalidateQueries({ queryKey: ["access", userId] })]); } });
  return <div className="flex flex-col gap-6"><PageHeading title="المدفوعات والوصول" description="الحالة يعيدها الخادم. نجاح الدفع لا يعني وصولًا دائمًا؛ انتهاء الصلاحية والاسترداد يؤثران على الاستحقاق." />
    <label className="flex flex-col gap-2 text-sm">الحالة<select className="h-11 rounded-xl border bg-card px-3" value={status} onChange={event => { setStatus(event.target.value); setVerified(null); verify.reset(); }}><option value="">جميع الحالات</option>{Object.entries(statuses).map(([value, label]) => <option key={value} value={value.toLowerCase()}>{label}</option>)}</select></label>
    {query.isPending ? <Loading /> : query.isError ? <ErrorState error={query.error} retry={() => void query.refetch()} /> : !query.data.length ? <EmptyState title="لا توجد مدفوعات" description="شراء خدمة التنقل اختياري ويتم من صفحة العقار." /> : query.data.map(item => <article key={item.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-5"><div><p className="font-bold">تحليل التنقل · {statuses[item.status]}</p><p className="mt-2 text-sm">{item.currency ? `${item.amount / 100} ${item.currency}` : "عملة غير متاحة — يحتاج السجل للمراجعة"}</p><p className="text-xs text-muted-foreground">رقم العملية المحلي: {item.id} · الصلاحية: <bdi>{item.accessExpiresAt || "—"}</bdi></p></div><Button variant="outline" disabled={verify.isPending} onClick={() => verify.mutate(item.id)}>{verify.isPending && verify.variables === item.id ? "جارٍ التحقق…" : "تحقق من الخادم"}</Button></article>)}
    {verify.isError ? <ErrorState error={verify.error} /> : null}{verified ? <p role="status">الحالة المؤكدة للعملية {verified.id}: {statuses[verified.status]}</p> : null}
    {verified?.status === "FAILED" ? <Button variant="outline" onClick={() => { sessionStorage.removeItem(`madar-checkout-key:${userId}`); setVerified(null); }}>السماح بمحاولة دفع جديدة</Button> : null}
  </div>;
}
const subscribe = () => () => {};
export function PaymentReturn() {
  const { userId } = useIdentity();
  const localId = useSyncExternalStore(subscribe, () => { try { return sessionStorage.getItem(`madar-payment:${userId}`); } catch { return null; } }, () => null);
  const origin = useSyncExternalStore(subscribe, () => { try { return sessionStorage.getItem(`madar-payment-origin:${userId}`); } catch { return null; } }, () => null);
  const id = localId && /^\d+$/.test(localId) && Number(localId) > 0 && Number(localId) <= 2147483647 ? Number(localId) : null;
  const verification = useQuery({ queryKey: ["payment-verification", userId, id], queryFn: ({ signal }) => payments.verify(userId, id!, signal), enabled: id !== null, staleTime: 0, retry: false });
  const access = useQuery({ queryKey: ["access-after-verify", userId, verification.dataUpdatedAt], queryFn: ({ signal }) => payments.access(userId, signal), enabled: verification.isSuccess, staleTime: 0, retry: false });
  let coordinates: { latitude: number; longitude: number } | null = null;
  try { const parsed = JSON.parse(origin || "null"); if (parsed && validCoordinates(parsed.latitude, parsed.longitude)) coordinates = parsed; } catch { /* optional return context */ }
  return <div className="flex flex-col gap-6"><PageHeading title="التحقق من الدفع" description="العودة من Moyasar ليست إثباتًا للدفع. نتحقق من الحالة والاستحقاق لدى الخادم." />
    {!id ? <EmptyState title="لا توجد محاولة مرتبطة بهذه الجلسة" description="انتقل إلى سجل المدفوعات للتحقق يدويًا. لا نستخدم معرّف المزوّد بدل رقم العملية المحلي." /> : verification.isPending ? <Loading /> : verification.isError ? <ErrorState error={verification.error} retry={() => void verification.refetch()} /> : <>
      <p role="status" className="rounded-2xl border bg-card p-5">{statuses[verification.data.status]}{verification.data.status === "PENDING" ? " — قد يتأخر التأكيد؛ استخدم التحقق اليدوي دون بدء شراء مكرر." : ""}</p>
      {access.isPending ? <p>جارٍ إعادة التحقق من الوصول…</p> : access.isError ? <ErrorState error={access.error} retry={() => void access.refetch()} /> : access.data?.access ? <><p className="text-primary">أكد الخادم استحقاق الخدمة حتى <bdi>{access.data.expiresAt || "—"}</bdi>.</p>{coordinates ? <CommutePanel {...coordinates} /> : null}</> : <p>لا يوجد استحقاق نشط مؤكد. لن يُفتح التحليل.</p>}
      <Button disabled={verification.isFetching} onClick={() => void verification.refetch()}>تحقق مجددًا</Button>
    </>}
  </div>;
}
