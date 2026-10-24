"use client";
import { RouteError, type RouteErrorProps } from "@/components/product/route-error";
export default function Error(props: RouteErrorProps) { return <RouteError {...props} title={"تعذّر عرض صفحة الملف"} description={"لم نتمكن من عرض صفحة الملف المحلي. أعد المحاولة؛ يمكنك متابعة التصفح العام."} backHref={"/properties"} backLabel={"استكشف العقارات"} />; }
