import { Skeleton } from "@/components/ui/skeleton";
export function PageSkeleton({ kind = "form" }: { kind?: "form" | "cards" | "comparison" | "map" | "payment" }) {
  return <div role="status" aria-label="جارٍ تحميل الصفحة" className="flex flex-col gap-6"><Skeleton className="h-10 w-2/3" /><Skeleton className="h-5 w-1/2" />
    {kind === "cards" ? <div className="grid gap-5 md:grid-cols-2">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-52 w-full rounded-3xl" />)}</div>
      : kind === "comparison" ? <><Skeleton className="h-16 w-full" /><div className="grid grid-cols-2 gap-4"><Skeleton className="h-72 w-full" /><Skeleton className="h-72 w-full" /></div></>
      : kind === "map" ? <><Skeleton className="h-80 w-full rounded-3xl" /><Skeleton className="h-48 w-full" /></>
      : kind === "payment" ? <div className="mx-auto flex w-full max-w-xl flex-col gap-4 rounded-3xl border bg-card p-6"><Skeleton className="h-8 w-1/2" /><Skeleton className="h-64 w-full" /><Skeleton className="h-11 w-full" /></div>
      : <div className="grid gap-6 md:grid-cols-2">{[0, 1].map(i => <div key={i} className="flex flex-col gap-5 rounded-3xl border bg-card p-6"><Skeleton className="h-8 w-1/2" />{[0, 1, 2].map(j => <Skeleton key={j} className="h-11 w-full" />)}<Skeleton className="h-12 w-2/3" /></div>)}</div>}
  </div>;
}
