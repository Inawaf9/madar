"use client";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useRouter } from "@/i18n/navigation";
import { registerSchema, loginSchema, safeSessionSchema } from "@/lib/auth/contracts";
import { authMutation, safeReturnTo } from "@/lib/auth/client";
import { setClientSession } from "@/lib/user-id";
import { broadcastAuthChange } from "./session-provider";
import { DataForm, type FormFieldRenderProps } from "@/components/forms/data-form";
import { AuthFrame } from "./auth-presentation";
import { AuthField } from "./auth-field";
import { LoginLegalNotice, RegistrationConsent } from "./auth-legal";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ApiError } from "@/lib/api/errors";
type ConfigurationStatus =
  | "ready"
  | "missing-cookie-key"
  | "invalid-cookie-key"
  | "invalid-backend"
  | "invalid-origin";
export function AuthForm({
  mode,
  configurationStatus,
}: {
  mode: "login" | "register";
  configurationStatus: ConfigurationStatus;
}) {
  const available = configurationStatus === "ready";
  const t = useTranslations("AuthUI");
  const router = useRouter();
  const cache = useQueryClient();
  const registrationFormSchema = registerSchema.extend({
    legalAgreement: z.literal(true, { error: t("consentRequired") }),
  });
  const submit = async (value: unknown) => {
    const registration = mode === "register" ? registrationFormSchema.parse(value) : null;
    const body = registration
      ? {
          fullName: registration.fullName,
          email: registration.email,
          password: registration.password,
        }
      : value;
    const session = safeSessionSchema.parse(await authMutation(mode, body));
    await cache.cancelQueries();
    cache.clear();
    setClientSession(session);
    broadcastAuthChange();
    router.replace(safeReturnTo(new URLSearchParams(window.location.search).get("next")));
    router.refresh();
  };
  const fields = [
    {
      name: "email",
      label: t("email"),
      fullWidth: true,
      render: (props: FormFieldRenderProps) => (
        <AuthField
          {...props}
          kind="email"
        />
      ),
    },
    {
      name: "password",
      label: t("password"),
      fullWidth: true,
      ...(mode === "register" ? { description: t("passwordRequirements") } : {}),
      render: (props: FormFieldRenderProps) => (
        <AuthField
          {...props}
          kind="password"
          newPassword={mode === "register"}
        />
      ),
    },
  ];
  return (
    <AuthFrame
      title={t(`${mode}Title`)}
      description={t(`${mode}Description`)}
    >
      {!available ? (
        <Alert className="mb-6 bg-secondary/50">
          <AlertTitle>{t("configurationTitle")}</AlertTitle>
          <AlertDescription>{t("configurationDescription")}</AlertDescription>
        </Alert>
      ) : null}
      <div className="madar-auth-fields">
        {mode === "register" ? (
          <DataForm
            schema={registrationFormSchema}
            defaults={{ legalAgreement: false }}
            fields={[
              {
                name: "fullName",
                label: t("fullName"),
                fullWidth: true,
                render: (props) => (
                  <AuthField
                    {...props}
                    kind="fullName"
                  />
                ),
              },
              ...fields,
              {
                name: "legalAgreement",
                label: t("consentLabel"),
                fullWidth: true,
                visuallyHiddenLabel: true,
                validationMessage: t("consentRequired"),
                render: (props) => <RegistrationConsent {...props} />,
              },
            ]}
            submitLabel={t("registerSubmit")}
            disabled={!available}
            showSuccess={false}
            onSubmit={submit}
          />
        ) : (
          <DataForm
            schema={loginSchema}
            fields={fields}
            submitLabel={t("loginSubmit")}
            disabled={!available}
            showSuccess={false}
            onSubmit={submit}
            getSubmitError={(error) =>
              error instanceof ApiError && error.status === 401
                ? t("invalidCredentials")
                : undefined
            }
          />
        )}
      </div>
      {mode === "login" ? <LoginLegalNotice /> : null}
      <p className="mt-6 flex flex-wrap items-center justify-center gap-x-2 text-sm text-muted-foreground">
        {t(mode === "login" ? "needAccount" : "haveAccount")}
        <Link
          href={mode === "login" ? "/register" : "/login"}
          className="inline-flex min-h-11 items-center rounded-lg font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
        >
          {t(mode === "login" ? "createAccount" : "signIn")}
        </Link>
      </p>
    </AuthFrame>
  );
}
