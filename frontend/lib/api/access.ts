/**
 * The current backend trusts caller-supplied user IDs. Keep its proxy available
 * only for local development or deployments explicitly marked isolated staging.
 * This is an environment boundary, not authentication or authorization.
 */
export function isUnauthenticatedBackendAccessEnabled() {
  const stagingIsExplicit = process.env.MADAR_UNAUTHENTICATED_API_ENV === "isolated-staging"
    && process.env.VERCEL_ENV !== "production";
  if (stagingIsExplicit) return true;

  if (process.env.NODE_ENV !== "development") return false;
  const baseUrl = process.env.API_BASE_URL || "http://localhost:8080";
  try {
    const hostname = new URL(baseUrl).hostname.replace(/^\[|\]$/g, "");
    return ["localhost", "127.0.0.1", "::1"].includes(hostname);
  } catch {
    return false;
  }
}
