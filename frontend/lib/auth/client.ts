"use client";
import { ApiError } from "@/lib/api/errors";
export async function csrfHeaders(): Promise<Record<string, string>> {
  const response = await fetch("/api/auth/csrf", {
    cache: "no-store",
    credentials: "same-origin",
  });
  const body = await response.json();
  if (!response.ok || typeof body.csrfToken !== "string")
    throw new ApiError("Security check unavailable", 503);
  return { "X-Madar-CSRF": body.csrfToken };
}
export async function authMutation(
  operation:
    | "login"
    | "register"
    | "logout"
    | "logout-all"
    | "change-password"
    | "forgot-password"
    | "verify-reset-code"
    | "reset-password",
  body?: unknown,
) {
  const response = await fetch(`/api/auth/${operation}`, {
    method: operation === "change-password" ? "PATCH" : "POST",
    cache: "no-store",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(await csrfHeaders()) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) {
    if (operation === "change-password" && response.status === 401)
      window.dispatchEvent(new Event("madar-session-ended"));
    throw new ApiError("Authentication request failed", response.status, result.message);
  }
  return result;
}
// Redirect only to known local product destinations. Never accept protocol-relative URLs.
export function safeReturnTo(value: string | null): string {
  if (!value || /[\\#\x00-\x20]/.test(value)) return "/dashboard";
  return /^\/(dashboard|profile|saved|interests|locations|neighborhood|moving-checklist|compare|payments)(\/[A-Za-z0-9_-]+)*$/.test(
    value,
  )
    ? value
    : "/dashboard";
}
