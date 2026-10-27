import "server-only";
import { authApi } from "./auth-api.server";
import { deleteSession, readSession } from "./session.server";

export type LogoutResult = {
  revocation: "confirmed" | "unconfirmed" | "no-local-session";
  scope: "family" | "all";
};
/** Never rotate or retry. Clear local credentials even if backend revocation is uncertain. */
export async function logout(scope: "family" | "all" = "family"): Promise<LogoutResult> {
  let revocation: LogoutResult["revocation"] = "unconfirmed";
  try {
    const session = await readSession();
    if (!session) revocation = "no-local-session";
    else {
      if (scope === "all") await authApi.logoutAll();
      else await authApi.logout({ refreshToken: session.refreshToken });
      revocation = "confirmed";
    }
  } catch {
    /* Do not claim backend success on timeout, invalid access, parsing or infrastructure errors. */
  } finally {
    await deleteSession();
  }
  return { revocation, scope };
}
