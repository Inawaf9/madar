"use client";
import { RouteError, type RouteErrorProps } from "@/components/shared/route-error";
export default function Error(props: RouteErrorProps) {
  return (
    <RouteError
      {...props}
      title={"تعذّر عرض البيت المحفوظ"}
      description={"ما قدرنا نعرض مرجع البيت. حاول مرة ثانية أو ارجع للبيوت المحفوظة."}
      backHref={"/saved"}
      backLabel={"المحفوظات"}
    />
  );
}
