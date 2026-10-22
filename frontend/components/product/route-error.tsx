"use client";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
export type RouteErrorProps = { error: unknown; reset: () => void; retry?: () => void };
export function RouteError({ reset, retry }: RouteErrorProps) {
  return <div role="alert" className="mx-auto my-8 flex max-w-xl flex-col gap-4 rounded-3xl border bg-card p-6 shadow-stone"><h2 className="font-heading text-xl font-bold">تعذّر عرض هذه الصفحة</h2><p className="text-sm leading-7 text-muted-foreground">حدث خطأ غير متوقع. يمكنك إعادة المحاولة أو متابعة استكشاف العقارات.</p><div className="flex flex-wrap gap-3"><Button onClick={() => (retry || reset)()}>أعد المحاولة</Button><Button variant="outline" nativeButton={false} render={<Link href="/properties" />}>استكشف العقارات</Button></div></div>;
}
