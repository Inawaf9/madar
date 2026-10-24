"use client";
import { createContext, useContext } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { clearUserId } from "@/lib/user-id";
import { useProfile } from "@/features/account/api/hooks";
import type { UserResponse } from "@/lib/api/contracts";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { MadarLoader } from "@/components/branding/madar-loader";
import { useLocalUserId } from "./use-local-user-id";
import { Button } from "@/components/ui/button";
const IdentityContext = createContext<{ userId: number; user: UserResponse; logout: () => Promise<void> } | null>(null);
export function useIdentity() { const context = useContext(IdentityContext); if (!context) throw new Error("Missing local user context"); return context; }
export function IdentityGate({ children }: { children: React.ReactNode }) {
  const id = useLocalUserId(); const profile = useProfile(id); const router = useRouter(); const cache = useQueryClient(); const t = useTranslations("Workspace");
  async function logout() { clearUserId(); await cache.cancelQueries(); cache.clear(); router.replace("/properties"); }
  if (!id) return <div className="mx-auto max-w-2xl p-6"><EmptyState title="اختر ملفك المحلي" description="التصفح العام متاح دون تسجيل. الميزات الشخصية تحتاج معرّف مستخدم موجودًا؛ هذا اختيار تطويري وليس تسجيل دخول موثّقًا."><Button nativeButton={false} render={<Link href="/login" />}>اختيار الملف المحلي</Button><Button variant="outline" nativeButton={false} render={<Link href="/properties" />}>متابعة الاستكشاف العام</Button></EmptyState></div>;
  if (profile.isError) return <div className="mx-auto max-w-xl p-6"><ErrorState error={profile.error} retry={() => void profile.refetch()} /><Button className="mt-4" variant="outline" onClick={() => void logout()}>{t("logout")}</Button></div>;
  if (profile.isPending) return <div className="mx-auto max-w-xl p-6"><MadarLoader size="lg" variant="section" /></div>;
  if (!profile.data || profile.data.id !== id) return <div className="p-6">تعذّر التحقق من الملف المحلي.<Button onClick={() => void logout()}>مسح الملف</Button></div>;
  return <IdentityContext value={{ userId: id, user: profile.data, logout }}>{children}</IdentityContext>;
}
