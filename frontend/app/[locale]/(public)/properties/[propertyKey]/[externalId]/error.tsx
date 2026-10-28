"use client";
import { RouteError, type RouteErrorProps } from "@/components/shared/route-error";
export default function Error(props: RouteErrorProps) {
  return (
    <RouteError
      {...props}
      title={"تعذّر عرض تفاصيل البيت"}
      description={
        "ما قدرنا نعرض تفاصيل هذا الإعلان. حاول مرة ثانية أو شوف خيارات ثانية."
      }
      backHref={"/properties"}
      backLabel={"العودة للبحث"}
    />
  );
}
