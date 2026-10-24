"use client";
import { RouteError, type RouteErrorProps } from "@/components/product/route-error";
export default function Error(props: RouteErrorProps) { return <RouteError {...props} title={"تعذّر عرض المدفوعات"} description={"لم نتمكن من عرض حالة المدفوعات. أعد المحاولة قبل بدء شراء آخر؛ لا نفترض نجاح عملية أو فشلها."} backHref={"/dashboard"} backLabel={"لوحة المتابعة"} />; }
