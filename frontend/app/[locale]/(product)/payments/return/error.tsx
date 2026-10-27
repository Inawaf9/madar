"use client";
import { RouteError, type RouteErrorProps } from "@/components/shared/route-error";
export default function Error(props: RouteErrorProps) {
  return (
    <RouteError
      {...props}
      title={"تعذّر عرض التحقق من الدفع"}
      description={
        "حالة الدفع ما تأكدت في هذه الصفحة. حاول مرة ثانية أو تحقق من سجل المدفوعات قبل تدفع مجددًا."
      }
      backHref={"/payments"}
      backLabel={"سجل المدفوعات"}
    />
  );
}
