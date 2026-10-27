"use client";
import { RouteError, type RouteErrorProps } from "@/components/shared/route-error";
export default function Error(props: RouteErrorProps) {
  return (
    <RouteError
      {...props}
      title={"تعذّر عرض البحث"}
      description={"ما قدرنا نعرض البحث الآن. حاول مرة ثانية أو ارجع للرئيسية."}
      backHref={"/"}
      backLabel={"العودة للرئيسية"}
    />
  );
}
