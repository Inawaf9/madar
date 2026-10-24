"use client";
import { RouteError, type RouteErrorProps } from "@/components/product/route-error";
export default function Error(props: RouteErrorProps) { return <RouteError {...props} title={"تعذّر عرض تفاصيل العقار"} description={"لم نتمكن من عرض تفاصيل هذا الإعلان. أعد المحاولة أو تابع البحث عن خيارات أخرى."} backHref={"/properties"} backLabel={"العودة للبحث"} />; }
