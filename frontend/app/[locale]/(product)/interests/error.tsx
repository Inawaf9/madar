"use client";
import { RouteError, type RouteErrorProps } from "@/components/product/route-error";
export default function Error(props: RouteErrorProps) { return <RouteError {...props} title={"تعذّر عرض اهتماماتك"} description={"لم نتمكن من عرض الاهتمامات. أعد المحاولة؛ يبقى الاستكشاف العام متاحًا."} backHref={"/properties"} backLabel={"استكشف العقارات"} />; }
