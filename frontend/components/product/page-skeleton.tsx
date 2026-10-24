import { PropertyCardPlaceholder } from "@/components/property/property-card-view";
import { MadarLoader } from "@/components/branding/madar-loader";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingStatus } from "./loading-status";
import { cn } from "@/lib/utils";

export function HeadingSkeleton() {
  return <LoadingStatus label="جارٍ تحميل الصفحة" className="mb-6"><div className="flex min-w-0 items-center gap-3"><MadarLoader decorative size="sm" /><div className="flex min-w-0 flex-1 flex-col gap-2"><Skeleton className="h-8 w-4/5 max-w-lg sm:h-9" /><Skeleton className="h-5 w-full max-w-xl" /></div></div></LoadingStatus>;
}
export function FormPanelSkeleton({ fields = 6 }: { fields?: number }) {
  return <LoadingStatus label="جارٍ تحميل البيانات والنموذج"><div className="@container/form-panel flex flex-col gap-5 rounded-2xl border border-border/70 bg-card p-5"><Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-5/6" />{fields ? <div className="grid gap-4 @min-[26rem]/form-panel:grid-cols-2">{Array.from({ length: fields }, (_, i) => <div key={i} className="flex flex-col gap-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-11 w-full rounded-xl" /></div>)}</div> : null}<Skeleton className="h-12 w-32 rounded-xl" /></div></LoadingStatus>;
}
export function MapSkeleton() {
  return <LoadingStatus label="جارٍ تحميل المواقع"><Skeleton className="h-80 w-full rounded-2xl sm:h-96" /></LoadingStatus>;
}
export function SavedCardsSkeleton({ className }: { className?: string }) {
  return <LoadingStatus label="جارٍ تحميل العقارات المحفوظة"><div className="@container/saved-skeleton"><div className={cn("grid auto-rows-fr gap-5 @min-[38rem]/saved-skeleton:grid-cols-2", className)}>{[0, 1].map(i => <PropertyCardPlaceholder key={i} />)}</div></div></LoadingStatus>;
}
export function SummaryPanelSkeleton() {
  return <LoadingStatus label="جارٍ تحميل ملخص الإعدادات"><div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5"><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-11 w-28 rounded-xl" /></div></LoadingStatus>;
}
export function ListSkeleton({ kind = "places" }: { kind?: "places" | "interests" | "services" }) {
  return <LoadingStatus label="جارٍ تحميل القائمة"><div className="flex flex-col gap-4">{[0, 1, 2].map(i => <div key={i} className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-5"><Skeleton className="h-6 w-2/3" /><Skeleton className="h-4 w-4/5" />{kind === "places" ? <div className="grid grid-cols-2 gap-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div> : null}{kind !== "services" ? <div className="flex gap-2"><Skeleton className="h-11 w-24 rounded-xl" /><Skeleton className="size-11 rounded-xl" /></div> : null}</div>)}</div></LoadingStatus>;
}
export function SummarySkeleton() {
  return <LoadingStatus label="جارٍ تحميل الملخص"><div className="flex flex-wrap gap-3 rounded-2xl border bg-card p-5">{[0, 1, 2].map(i => <Skeleton key={i} className="h-6 w-32" />)}</div></LoadingStatus>;
}
export function ListingSummarySkeleton() {
  return <LoadingStatus label="جارٍ تحميل بيانات الإعلان"><div className="flex flex-col gap-3"><Skeleton className="h-6 w-5/6" /><Skeleton className="h-6 w-1/2" /><div className="grid grid-cols-2 gap-2">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-5 w-4/5" />)}</div><Skeleton className="h-3 w-1/3" /><Skeleton className="h-4 w-1/2" /></div></LoadingStatus>;
}
export function ComparisonTableSkeleton() {
  return <LoadingStatus label="جارٍ تحميل المقارنة"><div className="overflow-hidden rounded-xl border bg-card"><div className="grid grid-cols-3 gap-3 bg-muted p-4">{[0, 1, 2].map(i => <Skeleton key={i} className="h-5 w-full bg-background" />)}</div>{[0, 1, 2].map(i => <div key={i} className="grid grid-cols-3 gap-3 border-t p-4">{[0, 1, 2].map(j => <Skeleton key={j} className="h-5 w-full" />)}</div>)}</div></LoadingStatus>;
}
export function ComparisonListSkeleton() {
  return <LoadingStatus label="جارٍ تحميل المقارنات"><div className="grid gap-4 xl:grid-cols-2">{[0, 1].map(i => <div key={i} className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5"><Skeleton className="h-5 w-36" /><div className="grid gap-3 sm:grid-cols-2"><Skeleton className="h-24 w-full rounded-xl" /><Skeleton className="h-24 w-full rounded-xl" /></div><Skeleton className="h-11 w-32 rounded-xl" /></div>)}</div></LoadingStatus>;
}
export function DashboardStatsSkeleton() {
  return <LoadingStatus label="جارٍ تحميل ملخص نشاطك" className="mb-6"><div className="grid gap-3 sm:grid-cols-3">{[0, 1, 2].map(i => <div key={i} className="flex items-start justify-between gap-3 rounded-xl bg-secondary/35 p-4"><div className="flex flex-1 flex-col gap-2"><Skeleton className="h-5 w-24" /><Skeleton className="h-7 w-12" /></div><Skeleton className="size-9 rounded-xl" /></div>)}</div></LoadingStatus>;
}
export function DashboardSkeleton() {
  return <><HeadingSkeleton /><DashboardStatsSkeleton /><div className="grid items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_320px]"><div className="flex flex-col gap-4"><Skeleton className="h-7 w-48" /><SavedCardsSkeleton /></div><div className="flex flex-col gap-4"><SummaryPanelSkeleton /><SummaryPanelSkeleton /></div></div></>;
}
export function ProfileSkeleton() {
  return <><HeadingSkeleton /><div className="flex max-w-3xl flex-col gap-6"><SummaryPanelSkeleton /><Skeleton className="h-12 w-full max-w-sm rounded-xl" /><SummaryPanelSkeleton /></div></>;
}
export function SavedPageSkeleton() {
  return <><HeadingSkeleton /><Skeleton className="mb-5 h-11 w-full max-w-sm rounded-xl" /><SavedCardsSkeleton /></>;
}
export function LocationsSkeleton() {
  return <><HeadingSkeleton /><Skeleton className="mb-5 h-11 w-full max-w-sm rounded-xl" /><div className="grid gap-4 lg:grid-cols-2"><SummaryPanelSkeleton /><SummaryPanelSkeleton /></div></>;
}
export function InterestsSkeleton() {
  return <><HeadingSkeleton /><LoadingStatus label="جارٍ تحميل الاهتمامات"><div className="flex max-w-5xl flex-col gap-5 rounded-2xl border border-border/70 bg-card p-5"><Skeleton className="h-6 w-40" /><div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 9 }, (_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div><Skeleton className="h-10 w-32" /></div></LoadingStatus></>;
}
export function ComparisonSkeleton({ detail = false }: { detail?: boolean }) {
  return <><HeadingSkeleton />{detail ? <div className="flex max-w-6xl flex-col gap-6"><div className="grid gap-4 md:grid-cols-2"><SummaryPanelSkeleton /><SummaryPanelSkeleton /></div><SummaryPanelSkeleton /></div> : <ComparisonListSkeleton />}</>;
}
export function NeighborhoodSkeleton() {
  return <div className="flex flex-col gap-6"><HeadingSkeleton /><SummaryPanelSkeleton /><Skeleton className="h-12 w-full max-w-sm rounded-xl" /><SummarySkeleton /><SummaryPanelSkeleton /><ListSkeleton kind="services" /></div>;
}
export function PaymentHistorySkeleton() {
  return <LoadingStatus label="جارٍ تحميل سجل المدفوعات"><div className="flex flex-col gap-4">{[0, 1, 2].map(i => <div key={i} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-5"><div className="flex w-2/3 flex-col gap-3"><Skeleton className="h-6 w-4/5" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-full" /></div><Skeleton className="h-11 w-32 rounded-xl" /></div>)}</div></LoadingStatus>;
}
export function PaymentVerificationSkeleton() {
  return <LoadingStatus label="جارٍ التحقق من الدفع والاستحقاق لدى الخادم"><div className="flex flex-col gap-5 rounded-2xl border bg-card p-5"><MadarLoader decorative size="md" /><p className="text-sm text-muted-foreground">جارٍ التحقق من الحالة لدى الخادم…</p><Skeleton className="h-6 w-2/3" /><Skeleton className="h-5 w-1/2" /><Skeleton className="h-11 w-32 rounded-xl" /></div></LoadingStatus>;
}
export function CommuteAnalysisSkeleton() {
  return <LoadingStatus label="جارٍ حساب التنقل الفعلي"><div className="flex flex-col gap-4 rounded-2xl bg-secondary p-4"><MadarLoader decorative size="md" /><Skeleton className="h-6 w-4/5 bg-background" />{[0, 1, 2].map(i => <Skeleton key={i} className="h-5 w-2/3 bg-background" />)}<Skeleton className="h-3 w-full bg-background" /></div></LoadingStatus>;
}
export function PaymentsSkeleton({ verification = false }: { verification?: boolean }) {
  return <div className="flex flex-col gap-6"><HeadingSkeleton />{verification ? <PaymentVerificationSkeleton /> : <><Skeleton className="h-11 w-full max-w-xs rounded-xl" /><PaymentHistorySkeleton /></>}</div>;
}
export function AuthSkeleton({ register = false }: { register?: boolean }) {
  return <section className="mx-auto grid max-w-5xl items-start gap-10 py-12 sm:py-20 lg:grid-cols-2"><div><HeadingSkeleton /><LoadingStatus label="جارٍ تحميل صفحة الملف المحلي"><Skeleton className="h-52 w-full rounded-3xl" /></LoadingStatus></div><FormPanelSkeleton fields={register ? 3 : 0} /></section>;
}
