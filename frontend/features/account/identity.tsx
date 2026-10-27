"use client";
import { createContext, useContext } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useProfile } from "@/features/account/api/query-hooks";
import type { UserResponse } from "@/lib/api/contracts";
import type { SafeSession } from "@/lib/auth/contracts";
import { ErrorState } from "@/components/shared/error-state";
import { MadarLoader } from "@/components/branding/madar-loader";
import { useSafeSession } from "./session-hooks";
import { useAccountLogout } from "./use-account-logout";
import { Button } from "@/components/ui/button";
const IdentityContext = createContext<{
  userId: number;
  user: UserResponse;
  role: SafeSession["role"];
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  signingOut: boolean;
} | null>(null);
export function useIdentity() {
  const context = useContext(IdentityContext);
  if (!context) throw new Error("Missing authenticated identity context");
  return context;
}
export function IdentityGate({ children }: { children: React.ReactNode }) {
  const identity = useSafeSession();
  const id = identity?.userId ?? null;
  const profile = useProfile(id);
  const t = useTranslations("Workspace");
  const a = useTranslations("Auth");
  const { logout, logoutAll, signingOut, error } = useAccountLogout();
  if (!id || !identity)
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-4 p-6">
        <p>{a("signInRequired")}</p>
        <Button
          nativeButton={false}
          render={<Link href="/login" />}
        >
          {t("login")}
        </Button>
      </div>
    );
  if (profile.isError)
    return (
      <div className="mx-auto max-w-xl p-6">
        <ErrorState
          error={profile.error}
          retry={() => void profile.refetch()}
        />
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => void logout()}
        >
          {t("logout")}
        </Button>
        {error ? <ErrorState error={error} /> : null}
      </div>
    );
  if (profile.isPending)
    return (
      <div className="mx-auto max-w-xl p-6">
        <MadarLoader
          size="lg"
          variant="section"
        />
      </div>
    );
  if (!profile.data || profile.data.id !== id) return <p>{a("signInRequired")}</p>;
  return (
    <IdentityContext
      value={{
        userId: id,
        user: profile.data,
        role: identity.role,
        logout,
        logoutAll,
        signingOut,
      }}
    >
      {error ? <ErrorState error={error} /> : null}
      {children}
    </IdentityContext>
  );
}
