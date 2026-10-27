"use client";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthFrame } from "@/features/auth/auth-presentation";
export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("AuthUI");
  const [pending, startTransition] = useTransition();
  return (
    <AuthFrame
      title={t("errorTitle")}
      description={t("errorDescription")}
      compact
    >
      <Alert variant="destructive">
        <AlertDescription>{t("errorHelp")}</AlertDescription>
      </Alert>
      <Button
        className="mt-6 h-13 w-full text-base"
        disabled={pending}
        aria-busy={pending}
        onClick={() => startTransition(reset)}
      >
        {t(pending ? "retrying" : "retry")}
      </Button>
    </AuthFrame>
  );
}
