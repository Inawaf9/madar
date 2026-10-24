"use client";
import { RouteError, type RouteErrorProps } from "@/components/product/route-error";
export default function Error(props: RouteErrorProps) { return <RouteError {...props} title={"تعذّر عرض ملخصك"} description={"لم نتمكن من عرض لوحة المتابعة. أعد المحاولة أو انتقل إلى عقاراتك المحفوظة."} backHref={"/saved"} backLabel={"المحفوظات"} />; }
