"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Link, useRouter } from "@/i18n/navigation";
import { profileApi } from "@/lib/api/account";
import { registerUser } from "@/lib/api/account";
import { accountSchema, userIdSchema } from "@/lib/api/contracts";
import { saveUserId } from "@/lib/user-id";
import { DataForm } from "@/components/forms/data-form";
import { Panel } from "@/components/shared/panel";
import { PageHeading } from "@/components/shared/page-heading";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function AuthForm({ mode, developmentEnabled = false }: { mode: "login" | "register"; developmentEnabled?: boolean }) {
  const t = useTranslations("Workspace"); const router = useRouter(); const cache = useQueryClient(); const [registered, setRegistered] = useState(false);
  const establish = async (id: number) => { const user = await profileApi.get(id); if (user.id !== id) throw new Error("Invalid user response"); await cache.cancelQueries(); cache.clear(); saveUserId(user.id); router.replace("/dashboard"); };
  return <section className="mx-auto grid max-w-5xl items-start gap-10 py-12 sm:py-20 lg:grid-cols-2"><div><PageHeading title={t(mode)} description={t("authIntro")} /><div className="rounded-3xl bg-primary p-8 text-primary-foreground"><p className="font-heading text-2xl leading-relaxed">{t("authQuote")}</p><p className="mt-5 text-sm opacity-80">{t("developmentNote")}</p></div></div><div className="flex flex-col gap-5"><Panel title={t(mode)}>
    {mode === "register" ? registered ? null : <DataForm schema={accountSchema} fields={[{ name: "fullName", min: 3, maxLength: 100, autoComplete: "name", hint: "nameHint" }, { name: "email", type: "email", autoComplete: "email" }, { name: "password", type: "password", autoComplete: "new-password", hint: "passwordHint", maxLength: 64 }]} submitLabel={t("register")} onSubmit={async value => {
      const result = await registerUser(value);
      if ("id" in result && typeof result.id === "number" && result.id > 0) await establish(result.id);
      else setRegistered(true);
    }} /> : <Alert><AlertDescription>{t("loginGap")}</AlertDescription></Alert>}

    {registered ? <Alert className="mt-5"><AlertDescription>{t("registeredNoId")}</AlertDescription></Alert> : null}
    <p className="mt-6 text-sm text-muted-foreground"><Link href={mode === "login" ? "/register" : "/login"} className="underline underline-offset-4">{t(mode === "login" ? "needAccount" : "haveAccount")}</Link></p>
  </Panel>{developmentEnabled ? <details className="rounded-2xl border bg-card p-5"><summary className="cursor-pointer text-sm font-medium">{t("developmentAccess")}</summary><p className="my-4 text-sm leading-6 text-muted-foreground">{t("developmentAccessHint")}</p><DataForm schema={userIdSchema as z.ZodType<{ userId: number }, Record<string, unknown>>} fields={[{ name: "userId", type: "number", min: 1, max: 2147483647 }]} submitLabel={t("continue")} onSubmit={async ({ userId }) => establish(userId)} /></details> : null}</div></section>;
}
