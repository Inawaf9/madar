// User-specific content renders after client-side development identity loading.
export const instant = false;
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
export default async function Page() { redirect({ href: "/dashboard", locale: await getLocale() }); }
