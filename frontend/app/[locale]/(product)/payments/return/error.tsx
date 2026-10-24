"use client";
import { RouteError, type RouteErrorProps } from "@/components/product/route-error";
export default function Error(props: RouteErrorProps) { return <RouteError {...props} title={"تعذّر عرض التحقق من الدفع"} description={"حالة الدفع غير مؤكدة في هذه الصفحة. أعد المحاولة أو تحقق من العملية في سجل المدفوعات قبل الشراء مجددًا."} backHref={"/payments"} backLabel={"سجل المدفوعات"} />; }
