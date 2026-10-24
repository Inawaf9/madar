"use client";
import { RouteError, type RouteErrorProps } from "@/components/product/route-error";
export default function Error(props: RouteErrorProps) { return <RouteError {...props} title={"تعذّر عرض المحفوظات"} description={"حدث خطأ أثناء عرض القائمة. أعد المحاولة؛ لا يعني هذا حذف عقاراتك المحفوظة."} backHref={"/dashboard"} backLabel={"لوحة المتابعة"} />; }
