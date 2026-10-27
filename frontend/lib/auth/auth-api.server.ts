import "server-only";
import { z } from "zod";
import { requireSafeRefreshCoordination } from "./refresh-policy.server";
import { publicBackend, privateBackend } from "@/lib/api/backend.server";
import { ApiError } from "@/lib/api/errors";
import {
  authResponseSchema,
  loginSchema,
  registerSchema,
  forgotSchema,
  verifySchema,
  resetSchema,
  changeSchema,
  messageSchema,
  refreshRequestSchema,
} from "./contracts";
async function parsed<T>(result: Promise<unknown>, schema: z.ZodType<T>): Promise<T> {
  const value = schema.safeParse(await result);
  if (!value.success) throw new ApiError("Invalid authentication response", 502);
  return value.data;
}
export const authApi = {
  login: (input: unknown) =>
    parsed(
      publicBackend("/api/v1/auth/login", {
        method: "POST",
        body: loginSchema.parse(input),
      }),
      authResponseSchema,
    ),
  register: (input: unknown) =>
    parsed(
      publicBackend("/api/v1/auth/register", {
        method: "POST",
        body: registerSchema.parse(input),
      }),
      authResponseSchema,
    ),
  // No caller can submit a single-use proof without a verified distributed coordinator.
  refresh: async (input: unknown) => {
    const body = refreshRequestSchema.parse(input);
    requireSafeRefreshCoordination();
    return parsed(
      publicBackend("/api/v1/auth/refresh", { method: "POST", body }),
      authResponseSchema,
    );
  },
  logout: (input: unknown) =>
    parsed(
      publicBackend("/api/v1/auth/logout", {
        method: "POST",
        body: refreshRequestSchema.parse(input),
      }),
      messageSchema,
    ),
  logoutAll: () =>
    parsed(privateBackend("/api/v1/auth/logout-all", { method: "POST" }), messageSchema),
  forgot: (input: unknown) =>
    parsed(
      publicBackend("/api/v1/auth/forgot-password", {
        method: "POST",
        body: forgotSchema.parse(input),
      }),
      messageSchema,
    ),
  verify: (input: unknown) =>
    parsed(
      publicBackend("/api/v1/auth/verify-reset-code", {
        method: "POST",
        body: verifySchema.parse(input),
      }),
      z.object({ resetToken: z.string().min(1) }),
    ),
  reset: (input: unknown) =>
    parsed(
      publicBackend("/api/v1/auth/reset-password", {
        method: "POST",
        body: resetSchema.parse(input),
      }),
      messageSchema,
    ),
  change: (input: unknown) =>
    parsed(
      privateBackend("/api/v1/auth/change-password", {
        method: "PATCH",
        body: changeSchema.parse(input),
      }),
      messageSchema,
    ),
};
