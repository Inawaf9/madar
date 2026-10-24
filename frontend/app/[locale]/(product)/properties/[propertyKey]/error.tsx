"use client";
import { RouteError, type RouteErrorProps } from "@/components/product/route-error";
export default function Error(props: RouteErrorProps) { return <RouteError {...props} title={"تعذّر عرض العقار المحفوظ"} description={"لم نتمكن من عرض هذا المرجع وتفاصيله. أعد المحاولة أو ارجع إلى المحفوظات."} backHref={"/saved"} backLabel={"المحفوظات"} />; }
