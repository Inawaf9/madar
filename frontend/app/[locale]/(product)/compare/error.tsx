"use client";
import { RouteError, type RouteErrorProps } from "@/components/product/route-error";
export default function Error(props: RouteErrorProps) { return <RouteError {...props} title={"تعذّر عرض المقارنة"} description={"لم نتمكن من عرض المقارنات. أعد المحاولة أو ارجع إلى عقاراتك المحفوظة."} backHref={"/saved"} backLabel={"المحفوظات"} />; }
