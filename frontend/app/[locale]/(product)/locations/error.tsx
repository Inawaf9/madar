"use client";
import { RouteError, type RouteErrorProps } from "@/components/product/route-error";
export default function Error(props: RouteErrorProps) { return <RouteError {...props} title={"تعذّر عرض أماكنك المهمة"} description={"لم نتمكن من عرض الوجهات المحفوظة. أعد المحاولة أو تابع من لوحة المتابعة."} backHref={"/dashboard"} backLabel={"لوحة المتابعة"} />; }
