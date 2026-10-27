"use client";
import { RouteError, type RouteErrorProps } from "@/components/shared/route-error";
export default function Error(props: RouteErrorProps) {
  return (
    <RouteError
      {...props}
      title={"تعذّر عرض العقار المحفوظ"}
      description={"ما قدرنا نعرض مرجع العقار. حاول مرة ثانية أو ارجع للعقارات المحفوظة."}
      backHref={"/saved"}
      backLabel={"المحفوظات"}
    />
  );
}
