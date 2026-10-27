import { getTranslations } from "next-intl/server";
import { PasswordRecovery } from "@/features/auth/password-recovery";
export async function generateMetadata() {
  const t = await getTranslations("AuthUI");
  return { title: t("forgotTitle"), description: t("forgotDescription") };
}
export default function Page() {
  return <PasswordRecovery />;
}
