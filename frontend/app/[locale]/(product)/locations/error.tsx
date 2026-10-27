"use client";
import { RouteError, type RouteErrorProps } from "@/components/shared/route-error";
export default function Error(props: RouteErrorProps) {
  return (
    <RouteError
      {...props}
      title={"تعذّر عرض أماكنك المهمة"}
      description={"ما قدرنا نعرض أماكنك المحفوظة. حاول مرة ثانية أو ارجع للوحة التحكم."}
      backHref={"/dashboard"}
      backLabel={"لوحة التحكم"}
    />
  );
}
