"use client";
import { RouteError, type RouteErrorProps } from "@/components/product/route-error";
export default function Error(props: RouteErrorProps) { return <RouteError {...props} title={"تعذّر عرض معلومات الحي"} description={"لم نتمكن من عرض بيانات المنزل والخدمات القريبة. أعد المحاولة أو راجع منزلك في الملف."} backHref={"/profile"} backLabel={"الملف والمنزل"} />; }
