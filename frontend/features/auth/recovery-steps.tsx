"use client";

import { useTranslations } from "next-intl";
import { z } from "zod";
import { Link } from "@/i18n/navigation";
import { DataForm, type FormFieldRenderProps } from "@/components/forms/data-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forgotSchema, passwordSchema } from "@/lib/auth/contracts";
import { AuthField } from "./auth-field";
import { normalizeRecoveryCode } from "./recovery-code";
import type { usePasswordRecovery } from "./use-password-recovery";

type Recovery = ReturnType<typeof usePasswordRecovery>;

const codeSchema = z.object({ code: z.string().regex(/^[0-9]{6}$/) });
const resetFormSchema = z
  .object({ newPassword: passwordSchema, confirmPassword: z.string().min(1) })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
  });

function RecoveryCodeInput({
  id,
  inputRef,
  value,
  onChange,
  invalid,
  describedBy,
}: FormFieldRenderProps) {
  return (
    <Input
      id={id}
      ref={inputRef}
      name="code"
      type="text"
      value={typeof value === "string" ? value : ""}
      onChange={(event) => onChange(normalizeRecoveryCode(event.target.value))}
      autoComplete="one-time-code"
      inputMode="numeric"
      maxLength={6}
      dir="ltr"
      aria-invalid={invalid}
      aria-describedby={describedBy}
      placeholder="000000"
    />
  );
}

function ConfirmPasswordInput({
  id,
  inputRef,
  value,
  onChange,
  invalid,
  describedBy,
}: FormFieldRenderProps) {
  const t = useTranslations("AuthUI");
  return (
    <Input
      id={id}
      ref={inputRef}
      name="confirmPassword"
      type="password"
      value={typeof value === "string" ? value : ""}
      onChange={(event) => onChange(event.target.value)}
      autoComplete="new-password"
      maxLength={64}
      dir="ltr"
      aria-invalid={invalid}
      aria-describedby={describedBy}
      placeholder={t("confirmPasswordPlaceholder")}
    />
  );
}

export function RecoveryEmailForm({ recovery }: { recovery: Recovery }) {
  const t = useTranslations("AuthUI");
  return (
    <DataForm
      schema={forgotSchema}
      defaults={{ email: recovery.email }}
      fields={[
        {
          name: "email",
          label: t("email"),
          fullWidth: true,
          render: (props) => (
            <AuthField
              {...props}
              kind="email"
            />
          ),
        },
      ]}
      submitLabel={t("sendResetCode")}
      showSuccess={false}
      getSubmitError={recovery.sendError}
      onSubmit={async (value) => recovery.sendEmail(value.email)}
    />
  );
}

export function RecoveryVerificationForm({ recovery }: { recovery: Recovery }) {
  const t = useTranslations("AuthUI");
  return (
    <>
      <Alert className="mb-5 bg-secondary/40">
        <AlertDescription>
          {t("resetEmailNotice", { email: recovery.email })}
        </AlertDescription>
      </Alert>
      <DataForm
        schema={codeSchema}
        fields={[
          {
            name: "code",
            label: t("resetCode"),
            fullWidth: true,
            validationMessage: t("resetCodeFormat"),
            render: (props) => <RecoveryCodeInput {...props} />,
          },
        ]}
        submitLabel={t("verifyResetCode")}
        pending={recovery.resending}
        showSuccess={false}
        getSubmitError={recovery.verifyError}
        onSubmit={async (value) => recovery.verifyCode(value.code)}
      />
      {recovery.resendError ? (
        <Alert
          variant="destructive"
          className="mt-5"
        >
          <AlertDescription>{recovery.resendError}</AlertDescription>
        </Alert>
      ) : null}
      {recovery.resendMessage ? (
        <p
          role="status"
          className="mt-4 text-sm text-muted-foreground"
        >
          {recovery.resendMessage}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button
          type="button"
          variant="link"
          className="px-0"
          disabled={recovery.resending || recovery.verifying || recovery.resendBlocked}
          onClick={() => void recovery.resendCode()}
        >
          {recovery.resending
            ? t("sendingResetCode")
            : recovery.resendBlocked
              ? t("resendWait")
              : t("resendResetCode")}
        </Button>
        <Button
          type="button"
          variant="link"
          className="px-0"
          disabled={recovery.resending || recovery.verifying}
          onClick={recovery.restart}
        >
          {t("changeResetEmail")}
        </Button>
      </div>
    </>
  );
}

export function RecoveryPasswordForm({ recovery }: { recovery: Recovery }) {
  const t = useTranslations("AuthUI");
  return (
    <>
      <DataForm
        schema={resetFormSchema}
        fields={[
          {
            name: "newPassword",
            label: t("newPassword"),
            description: t("passwordRequirements"),
            fullWidth: true,
            validationMessage: t("passwordRequirements"),
            render: (props) => (
              <AuthField
                {...props}
                kind="password"
                newPassword
              />
            ),
          },
          {
            name: "confirmPassword",
            label: t("confirmPassword"),
            fullWidth: true,
            validationMessage: t("passwordsDoNotMatch"),
            render: (props) => <ConfirmPasswordInput {...props} />,
          },
        ]}
        submitLabel={t("saveNewPassword")}
        showSuccess={false}
        getSubmitError={recovery.resetError}
        onSubmit={async (value) => recovery.savePassword(value.newPassword)}
      />
      <Button
        type="button"
        variant="link"
        className="mt-3 px-0"
        disabled={recovery.resetting}
        onClick={recovery.restart}
      >
        {t("restartRecovery")}
      </Button>
    </>
  );
}

export function RecoverySuccess() {
  const t = useTranslations("AuthUI");
  return (
    <Link
      href="/login"
      className={buttonVariants({ size: "lg", className: "h-13 w-full" })}
    >
      {t("backToLogin")}
    </Link>
  );
}
