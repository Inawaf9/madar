"use client";
import { RouteError, type RouteErrorProps } from "@/components/shared/route-error";
export default function Error(props: RouteErrorProps) {
  return (
    <RouteError
      {...props}
      title={"تعذّر عرض المقارنة"}
      description={"ما قدرنا نعرض المقارنات. حاول مرة ثانية أو ارجع للعقارات المحفوظة."}
      backHref={"/saved"}
      backLabel={"المحفوظات"}
    />
  );
}
