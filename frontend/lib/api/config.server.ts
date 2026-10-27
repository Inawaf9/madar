import "server-only";
import { ApiError } from "./errors";

export function backendBaseUrl() {
  const value = process.env.MADAR_BACKEND_BASE_URL;
  if (!value)
    throw new ApiError(
      "Backend configuration unavailable",
      503,
      "Backend configuration unavailable",
    );
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ApiError(
      "Backend configuration unavailable",
      503,
      "Backend configuration unavailable",
    );
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (process.env.NODE_ENV === "production" && url.protocol !== "https:")
  ) {
    throw new ApiError(
      "Backend configuration unavailable",
      503,
      "Backend configuration unavailable",
    );
  }
  return url.origin + url.pathname.replace(/\/$/, "");
}
