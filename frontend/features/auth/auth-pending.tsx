import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthFrame } from "./auth-presentation";
export function AuthPending({ mode = "login" }: { mode?: "login" | "register" }) {
  const t = useTranslations("AuthUI");
  return (
    <AuthFrame
      title={t(`${mode}Title`)}
      description={t(`${mode}Description`)}
    >
      <div
        role="status"
        aria-busy="true"
        aria-label={t("loading")}
      >
        <span className="sr-only">{t("loading")}</span>
        <div
          aria-hidden="true"
          className="flex flex-col gap-6"
        >
          {Array.from({ length: mode === "register" ? 3 : 2 }, (_, index) => (
            <div
              key={index}
              className="flex flex-col gap-2"
            >
              <Skeleton className="h-4 w-24 motion-reduce:animate-none" />
              <Skeleton className="h-13 w-full rounded-xl motion-reduce:animate-none" />
            </div>
          ))}
          <Skeleton className="mt-2 h-13 w-full rounded-xl motion-reduce:animate-none" />
          <Skeleton className="mx-auto h-5 w-48 max-w-full motion-reduce:animate-none" />
        </div>
      </div>
    </AuthFrame>
  );
}
