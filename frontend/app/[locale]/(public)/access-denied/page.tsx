import { getTranslations } from "next-intl/server";
import { Alert, AlertDescription } from "@/components/ui/alert";
export default async function Page() {
  const t = await getTranslations("Auth");
  return (
    <Alert>
      <AlertDescription>{t("forbidden")}</AlertDescription>
    </Alert>
  );
}
