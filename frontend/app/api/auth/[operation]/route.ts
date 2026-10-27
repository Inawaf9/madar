import { logout } from "@/lib/auth/logout.server";
import { requireSafeRefreshCoordination } from "@/lib/auth/refresh-policy.server";
import { privateBackend } from "@/lib/api/backend.server";
import { type NextRequest } from "next/server";
import { authApi } from "@/lib/auth/auth-api.server";
import { checkCsrf, issueCsrf } from "@/lib/auth/csrf.server";
import {
  createSession,
  deleteSession,
  readSession,
  safeIdentity,
} from "@/lib/auth/session.server";
import { requireAuthConfiguration } from "@/lib/auth/config.server";
import { failure, json, readBody } from "@/lib/auth/http.server";
type Context = { params: Promise<{ operation: string }> };
export async function GET(request: NextRequest, context: Context) {
  try {
    const { operation } = await context.params;
    if (operation === "csrf") {
      if (request.headers.get("sec-fetch-site") === "cross-site")
        return json({ message: "Forbidden" }, 403);
      return json({ csrfToken: await issueCsrf() });
    }
    if (operation !== "session") return json({ message: "Not found" }, 404);
    const session = await readSession();
    if (!session) {
      await deleteSession();
      return json(null);
    }
    await privateBackend("/api/v1/user/me");
    return json(safeIdentity(session));
  } catch (error) {
    return failure(error);
  }
}
async function mutate(request: NextRequest, context: Context) {
  try {
    await checkCsrf(request);
    const { operation } = await context.params;
    if (
      (operation === "logout" || operation === "logout-all") &&
      request.method === "POST"
    ) {
      return json(await logout(operation === "logout-all" ? "all" : "family"));
    }
    // Never consume a proof: stateless replicas cannot safely single-flight strict rotation.
    if (operation === "refresh" && request.method === "POST")
      requireSafeRefreshCoordination();
    if (request.method === "POST") {
      if (operation === "forgot-password")
        return json(await authApi.forgot(await readBody(request)));
      if (operation === "verify-reset-code")
        return json(await authApi.verify(await readBody(request)));
      if (operation === "reset-password")
        return json(await authApi.reset(await readBody(request)));
    }
    if (operation === "change-password" && request.method === "PATCH") {
      const result = await authApi.change(await readBody(request));
      await deleteSession();
      return json(result);
    }
    if (!["login", "register"].includes(operation) || request.method !== "POST")
      return json({ message: "Not found" }, 404);
    // Check before registration so missing cookie configuration cannot create an unusable account.
    requireAuthConfiguration();
    const body = await readBody(request);
    const auth =
      operation === "login" ? await authApi.login(body) : await authApi.register(body);
    return json(await createSession(auth), operation === "register" ? 201 : 200);
  } catch (error) {
    return failure(error);
  }
}
export const POST = mutate;
export const PATCH = mutate;
