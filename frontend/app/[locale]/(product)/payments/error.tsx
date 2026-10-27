"use client";
import { RouteError, type RouteErrorProps } from "@/components/shared/route-error";
export default function Error(props: RouteErrorProps) {
  return (
    <RouteError
      {...props}
      title={"تعذّر عرض المدفوعات"}
      description={"ما قدرنا نعرض حالة المدفوعات. تحقق منها قبل تبدأ عملية دفع ثانية."}
      backHref={"/dashboard"}
      backLabel={"لوحة التحكم"}
    />
  );
}
