"use client";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@/i18n/navigation";
import { DataForm } from "@/components/forms/data-form";
import { changeSchema } from "@/lib/auth/contracts";
import { authMutation } from "@/lib/auth/client";
import { clearUserId } from "@/lib/user-id";
import { broadcastAuthChange } from "./session-provider";
export function ChangePasswordForm() {
  const t = useTranslations("Auth");
  const cache = useQueryClient();
  const router = useRouter();
  return (
    <DataForm
      schema={changeSchema}
      fields={[
        {
          name: "currentPassword",
          label: t("currentPassword"),
          type: "password",
          autoComplete: "current-password",
          fullWidth: true,
        },
        {
          name: "newPassword",
          label: t("newPassword"),
          type: "password",
          autoComplete: "new-password",
          hint: "passwordHint",
          maxLength: 64,
          fullWidth: true,
        },
      ]}
      submitLabel={t("changePassword")}
      showSuccess={false}
      onSubmit={async (value) => {
        await authMutation("change-password", value);
        clearUserId();
        await cache.cancelQueries();
        cache.clear();
        broadcastAuthChange();
        router.replace("/login");
        router.refresh();
      }}
    />
  );
}
