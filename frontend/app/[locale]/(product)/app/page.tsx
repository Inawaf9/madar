import { requirePageSession } from "@/lib/auth/authorization.server";
// Private content requires a server-side session.
export const instant = false;
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
export default async function Page() {
  await requirePageSession();
  redirect({ href: "/dashboard", locale: await getLocale() });
}
