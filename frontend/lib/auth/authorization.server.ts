import "server-only";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { readSession, safeIdentity } from "./session.server";
export async function requirePageSession() {
  const locale = await getLocale();
  const session = await readSession();
  if (!session) return redirect({ href: "/login", locale });
  return safeIdentity(session);
}
export async function requireAdminPage() {
  const session = await requirePageSession();
  if (session.role !== "ADMIN")
    redirect({ href: "/access-denied", locale: await getLocale() });
  return session;
}
