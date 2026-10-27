"use client";
import { RouteError, type RouteErrorProps } from "@/components/shared/route-error";
export default function Error(props: RouteErrorProps) {
  return (
    <RouteError
      {...props}
      title={"تعذّر عرض ملخصك"}
      description={"ما قدرنا نعرض لوحة التحكم. حاول مرة ثانية أو افتح عقاراتك المحفوظة."}
      backHref={"/saved"}
      backLabel={"المحفوظات"}
    />
  );
}
