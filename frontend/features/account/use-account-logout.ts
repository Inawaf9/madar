"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { authMutation } from "@/lib/auth/client";
import { clearUserId } from "@/lib/user-id";
import { broadcastAuthChange } from "@/features/auth/session-provider";

/** Shared browser cleanup after the BFF attempts backend refresh-token revocation. */
export function useAccountLogout() {
  const router = useRouter();
  const cache = useQueryClient();
  const t = useTranslations("Auth");
  const pending = useRef(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function signOut(operation: "logout" | "logout-all") {
    if (pending.current) return;
    pending.current = true;
    setSigningOut(true);
    setError(null);
    try {
      const result = await authMutation(operation);
      if (result.revocation !== "confirmed") toast.warning(t("revocationUnconfirmed"));
      clearUserId();
      await cache.cancelQueries();
      cache.clear();
      broadcastAuthChange();
      router.replace("/login");
      router.refresh();
    } catch (failure) {
      setError(failure);
    } finally {
      pending.current = false;
      setSigningOut(false);
    }
  }

  return {
    logout: () => signOut("logout"),
    logoutAll: () => signOut("logout-all"),
    signingOut,
    error,
  };
}
