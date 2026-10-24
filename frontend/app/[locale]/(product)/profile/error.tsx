"use client";
import { RouteError, type RouteErrorProps } from "@/components/product/route-error";
export default function Error(props: RouteErrorProps) { return <RouteError {...props} title={"تعذّر عرض ملفك"} description={"لم نتمكن من عرض معلومات الملف والتفضيلات. أعد المحاولة دون إعادة إرسال تعديلات سابقة."} backHref={"/dashboard"} backLabel={"لوحة المتابعة"} />; }
