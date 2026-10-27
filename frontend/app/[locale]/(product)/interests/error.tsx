"use client";
import { RouteError, type RouteErrorProps } from "@/components/shared/route-error";
export default function Error(props: RouteErrorProps) {
  return (
    <RouteError
      {...props}
      title={"تعذّر عرض اهتماماتك"}
      description={"ما قدرنا نعرض اهتماماتك الآن. حاول مرة ثانية أو تصفّح العقارات."}
      backHref={"/properties"}
      backLabel={"استكشف العقارات"}
    />
  );
}
