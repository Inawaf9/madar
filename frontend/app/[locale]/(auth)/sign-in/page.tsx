import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
export default async function Page() {
  redirect({ href: "/login", locale: await getLocale() });
}
