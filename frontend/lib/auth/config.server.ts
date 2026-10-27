import "server-only";
import { ApiError } from "@/lib/api/errors";
import { backendBaseUrl } from "@/lib/api/config.server";

/** An independent frontend AEAD key, never Spring's JWT signing key. */
export function cookieEncryptionKey(): Buffer {
  const encoded = process.env.MADAR_AUTH_COOKIE_SECRET?.trim();
  if (!encoded)
    throw new ApiError(
      "Cookie encryption key missing",
      503,
      "Cookie encryption key missing",
    );
  if (!/^[A-Za-z0-9+/]{43}=$/.test(encoded))
    throw new ApiError(
      "Cookie encryption key invalid",
      503,
      "Cookie encryption key invalid",
    );
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32 || key.toString("base64") !== encoded)
    throw new ApiError(
      "Cookie encryption key invalid",
      503,
      "Cookie encryption key invalid",
    );
  return key;
}

export function configuredAppOrigin(): string | undefined {
  const value = process.env.MADAR_APP_ORIGIN;
  if (!value && process.env.NODE_ENV !== "production") return undefined;
  try {
    const url = new URL(value ?? "");
    if (
      value !== url.origin ||
      (process.env.NODE_ENV === "production"
        ? url.protocol !== "https:"
        : !["http:", "https:"].includes(url.protocol))
    )
      throw new Error();
    return value;
  } catch {
    throw new ApiError(
      "App origin configuration invalid",
      503,
      "App origin configuration invalid",
    );
  }
}

export function requireAuthConfiguration() {
  cookieEncryptionKey();
  backendBaseUrl();
  configuredAppOrigin();
}
export type AuthConfigurationStatus =
  | "ready"
  | "missing-cookie-key"
  | "invalid-cookie-key"
  | "invalid-backend"
  | "invalid-origin";
export function authConfigurationStatus(): AuthConfigurationStatus {
  try {
    requireAuthConfiguration();
    return "ready";
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.message === "Cookie encryption key missing") return "missing-cookie-key";
      if (error.message === "Cookie encryption key invalid") return "invalid-cookie-key";
      if (error.message === "App origin configuration invalid") return "invalid-origin";
    }
    return "invalid-backend";
  }
}
