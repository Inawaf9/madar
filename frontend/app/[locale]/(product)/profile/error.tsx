"use client";
import { RouteError, type RouteErrorProps } from "@/components/shared/route-error";
export default function Error(props: RouteErrorProps) {
  return (
    <RouteError
      {...props}
      title={"تعذّر عرض ملفك"}
      description={
        "ما قدرنا نعرض حسابك وتفضيلاتك. حاول مرة ثانية، ولا ترسل أي تعديل سابق من جديد."
      }
      backHref={"/dashboard"}
      backLabel={"لوحة التحكم"}
    />
  );
}
