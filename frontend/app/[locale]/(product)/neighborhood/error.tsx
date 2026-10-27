"use client";
import { RouteError, type RouteErrorProps } from "@/components/shared/route-error";
export default function Error(props: RouteErrorProps) {
  return (
    <RouteError
      {...props}
      title={"تعذّر عرض معلومات الحي"}
      description={
        "ما قدرنا نعرض بيانات البيت والخدمات القريبة. حاول مرة ثانية أو راجع موقع بيتك في حسابك."
      }
      backHref={"/profile"}
      backLabel={"الحساب والبيت"}
    />
  );
}
