"use client";
import { RouteError, type RouteErrorProps } from "@/components/product/route-error";
export default function Error(props: RouteErrorProps) { return <RouteError {...props} title={"تعذّر عرض البحث"} description={"لم نتمكن من عرض أدوات البحث أو النتائج. أعد المحاولة؛ يمكنك أيضًا العودة إلى الرئيسية."} backHref={"/"} backLabel={"العودة للرئيسية"} />; }
