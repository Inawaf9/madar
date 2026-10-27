"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AuthFrame } from "./auth-presentation";
import {
  RecoveryEmailForm,
  RecoveryPasswordForm,
  RecoverySuccess,
  RecoveryVerificationForm,
} from "./recovery-steps";
import { usePasswordRecovery } from "./use-password-recovery";

const stepCopy = {
  email: ["forgotTitle", "forgotDescription"],
  verify: ["verifyTitle", "verifyDescription"],
  reset: ["resetTitle", "resetDescription"],
  done: ["resetCompleteTitle", "resetCompleteDescription"],
} as const;

type Recovery = ReturnType<typeof usePasswordRecovery>;

function RecoveryStep({ recovery }: { recovery: Recovery }) {
  switch (recovery.stage) {
    case "email":
      return <RecoveryEmailForm recovery={recovery} />;
    case "verify":
      return <RecoveryVerificationForm recovery={recovery} />;
    case "reset":
      return <RecoveryPasswordForm recovery={recovery} />;
    case "done":
      return <RecoverySuccess />;
  }
}

export function PasswordRecovery() {
  const t = useTranslations("AuthUI");
  const recovery = usePasswordRecovery();
  const [titleKey, descriptionKey] = stepCopy[recovery.stage];

  return (
    <AuthFrame
      title={t(titleKey)}
      description={t(descriptionKey)}
      compact
    >
      <RecoveryStep recovery={recovery} />
      {recovery.stage !== "done" ? (
        <Link
          href="/login"
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
        >
          {t("backToLogin")}
        </Link>
      ) : null}
    </AuthFrame>
  );
}
