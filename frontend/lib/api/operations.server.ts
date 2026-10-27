import "server-only";
import { z } from "zod";
import { ApiError } from "./errors";
import { requireSession, requireRole } from "@/lib/auth/session.server";
import { operationContracts } from "./operation-contracts";

const routes = operationContracts.map((contract) => ({
  contract,
  pattern: new RegExp(
    `^${contract.path
      .split("/")
      .map((part) => {
        if (/^\{.*\}$/.test(part)) {
          const name = part.slice(1, -1);
          if (name === "savedPropertyIds") return "[1-9]\\d*(?:%2C[1-9]\\d*){1,3}";
          if (
            [
              "homeId",
              "preferenceId",
              "interestId",
              "placeId",
              "savedPropertyId",
              "comparisonId",
              "notificationId",
              "paymentId",
              "targetUserId",
            ].includes(name)
          )
            return "[1-9]\\d*";
          return "[^/]+";
        }
        return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      })
      .join("/")}$`,
  ),
}));

/** Every personal actor comes from Spring's verified JWT, never an outgoing caller ID. */
export async function resolveOperation(path: string, method: string) {
  const route = routes.find(
    (entry) => entry.contract.method === method && entry.pattern.test(path),
  );
  if (!route) throw new ApiError("Operation unavailable", 404);
  if (route.contract.access === "admin") await requireRole("ADMIN");
  else if (route.contract.access === "private") await requireSession();
  return { path, public: route.contract.access === "public", contract: route.contract };
}
export function validateOperationQuery(
  contract: (typeof operationContracts)[number],
  params: URLSearchParams,
) {
  for (const key of params.keys()) {
    if (/^(userId|adminId|ownerId|user|owner|role)$/i.test(key))
      throw new ApiError("Actor identity must come from JWT", 400);
    if (contract.query !== null && !(contract.query as readonly string[]).includes(key))
      throw new ApiError("Unsupported query parameter", 400);
    if (params.getAll(key).length !== 1)
      throw new ApiError("Duplicate query parameter", 400);
  }
  for (const key of contract.requiredQuery)
    if (!params.has(key)) throw new ApiError("Missing query parameter", 400);
}
export function validateOperationHeaders(path: string, method: string, headers: Headers) {
  if (
    method === "POST" &&
    path === "/api/v1/payments/me/checkout" &&
    !z.uuid().safeParse(headers.get("idempotency-key")).success
  ) {
    throw new ApiError("A UUID Idempotency-Key is required", 400);
  }
}
