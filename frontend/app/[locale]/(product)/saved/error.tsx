"use client";
import { RouteError, type RouteErrorProps } from "@/components/shared/route-error";
export default function Error(props: RouteErrorProps) {
  return (
    <RouteError
      {...props}
      title={"تعذّر عرض المحفوظات"}
      description={
        "ما قدرنا نعرض بيوتي المحفوظة. حاول مرة ثانية. بيوتك ما انحذفت بسبب خطأ العرض."
      }
      backHref={"/dashboard"}
      backLabel={"لوحة التحكم"}
    />
  );
}
