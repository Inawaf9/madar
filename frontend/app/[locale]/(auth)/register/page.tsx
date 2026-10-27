import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { connection } from "next/server";
import { AuthForm } from "@/features/auth/auth-form";
import { authConfigurationStatus } from "@/lib/auth/config.server";
import { AuthPending } from "@/features/auth/auth-pending";
export const instant = false;
async function ReadyForm() {
  await connection();
  return (
    <AuthForm
      mode="register"
      configurationStatus={authConfigurationStatus()}
    />
  );
}
export default function Page() {
  return (
    <Suspense fallback={<AuthPending mode="register" />}>
      <ReadyForm />
    </Suspense>
  );
}

export async function generateMetadata() {
  const t = await getTranslations("AuthUI");
  return { title: t("registerTitle"), description: t("registerDescription") };
}
