"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { useErrorText } from "@/components/shared/error-state";
import { ApiError } from "@/lib/api/errors";
import { authMutation } from "@/lib/auth/client";

export type RecoveryStage = "email" | "verify" | "reset" | "done";

const verificationResponse = z.object({ resetToken: z.string().min(1) });

export function usePasswordRecovery() {
  const t = useTranslations("AuthUI");
  const errorText = useErrorText();
  const [stage, setStage] = useState<RecoveryStage>("email");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resendBlocked, setResendBlocked] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = useRef(false);
  const version = useRef(0);
  const operation = useRef<"verify" | "resend" | "reset" | null>(null);

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function isCurrent(startedAt: number) {
    return active.current && version.current === startedAt;
  }

  function startCooldown() {
    if (timer.current) clearTimeout(timer.current);
    setResendBlocked(true);
    timer.current = setTimeout(() => {
      if (active.current) setResendBlocked(false);
    }, 60_000);
  }

  function restart() {
    if (operation.current) return;
    version.current += 1;
    setResetToken(null);
    setResendError(null);
    setResendMessage(null);
    setStage("email");
  }

  async function sendEmail(nextEmail: string) {
    const startedAt = version.current;
    await authMutation("forgot-password", { email: nextEmail });
    if (!isCurrent(startedAt)) return;
    setEmail(nextEmail);
    setResendMessage(null);
    setResendError(null);
    startCooldown();
    setStage("verify");
  }

  async function verifyCode(code: string) {
    if (operation.current) return;
    operation.current = "verify";
    setVerifying(true);
    const startedAt = version.current;
    try {
      const response = verificationResponse.safeParse(
        await authMutation("verify-reset-code", { email, code }),
      );
      if (!response.success) throw new ApiError("Invalid recovery response", 502);
      if (!isCurrent(startedAt)) return;
      setResetToken(response.data.resetToken);
      setStage("reset");
    } finally {
      operation.current = null;
      if (isCurrent(startedAt)) setVerifying(false);
    }
  }

  async function resendCode() {
    if (operation.current || resendBlocked) return;
    operation.current = "resend";
    setResending(true);
    setResendError(null);
    setResendMessage(null);
    const startedAt = version.current;
    try {
      await authMutation("forgot-password", { email });
      if (!isCurrent(startedAt)) return;
      startCooldown();
      setResendMessage(t("resetCodeResent"));
    } catch (error) {
      if (isCurrent(startedAt)) {
        setResendError(
          error instanceof ApiError && error.status === 400
            ? t("sendCodeFailed")
            : errorText(error),
        );
      }
    } finally {
      operation.current = null;
      if (isCurrent(startedAt)) setResending(false);
    }
  }

  async function savePassword(newPassword: string) {
    if (!resetToken || operation.current) return;
    operation.current = "reset";
    setResetting(true);
    const startedAt = version.current;
    try {
      await authMutation("reset-password", { resetToken, newPassword });
      if (!isCurrent(startedAt)) return;
      setResetToken(null);
      setEmail("");
      setStage("done");
    } finally {
      operation.current = null;
      if (isCurrent(startedAt)) setResetting(false);
    }
  }

  const sendError = (error: unknown) =>
    error instanceof ApiError && error.status === 400 ? t("sendCodeFailed") : undefined;
  const verifyError = (error: unknown) =>
    error instanceof ApiError && error.backendMessage === "Invalid or expired reset code"
      ? t("invalidResetCode")
      : undefined;
  const resetError = (error: unknown) =>
    error instanceof ApiError && error.backendMessage === "Invalid or expired reset code"
      ? t("expiredResetToken")
      : undefined;

  return {
    stage,
    email,
    resending,
    verifying,
    resetting,
    resendBlocked,
    resendMessage,
    resendError,
    restart,
    sendEmail,
    verifyCode,
    resendCode,
    savePassword,
    sendError,
    verifyError,
    resetError,
  };
}
