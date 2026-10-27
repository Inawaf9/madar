import { useTranslations } from "next-intl";
import { CircleAlert } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { AuthFrame } from "./auth-presentation";

export function RecoveryUnavailable({ stage }: { stage: "forgot" | "verify" | "reset" }) {
  const t = useTranslations("AuthUI");
  return (
    <AuthFrame
      title={t(`${stage}Title`)}
      description={t(`${stage}Description`)}
      compact
    >
      <Alert className="gap-y-2 border-border bg-secondary/40 p-5">
        <CircleAlert
          aria-hidden="true"
          className="size-5 text-primary"
        />
        <AlertTitle className="text-base leading-relaxed">
          {t("recoveryUnavailableTitle")}
        </AlertTitle>
        <AlertDescription className="leading-relaxed">
          {t("recoveryUnavailableDescription")}
        </AlertDescription>
      </Alert>
      <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
        {t("recoveryAlternative")}
      </p>
      <Link
        href="/login"
        className={buttonVariants({
          size: "lg",
          className: "mt-7 h-13 w-full text-base",
        })}
      >
        {t("backToLogin")}
      </Link>
      <Link
        href="/properties"
        className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-lg text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
      >
        {t("browse")}
      </Link>
    </AuthFrame>
  );
}
