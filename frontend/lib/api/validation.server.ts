import "server-only";
import { z } from "zod";
import { ApiError } from "./errors";
import {
  currentHomeSchema,
  housingPreferenceSchema,
  lifestyleInterestSchema,
  placeSchema,
  savedPropertySchema,
  comparisonSchema,
} from "./contracts";
import { weightsSchema } from "./insight-contracts";
const resourceSchemas = {
  "current-home": currentHomeSchema.strict(),
  "housing-preference": housingPreferenceSchema.strict(),
  "lifestyle-interest": lifestyleInterestSchema.strict(),
  "place-preference": placeSchema.strict(),
  "saved-property": savedPropertySchema.strict(),
  "property-comparison": comparisonSchema.strict(),
};
export function validateBusinessRequest(path: string, method: string, body: unknown) {
  const resource = /^\/api\/v1\/([^/]+)\/me(?:\/[1-9]\d*)?$/.exec(path)?.[1];
  if (["POST", "PUT"].includes(method) && resource && resource in resourceSchemas) {
    return resourceSchemas[resource as keyof typeof resourceSchemas].parse(body);
  }
  if (path === "/api/v1/payments/me/checkout")
    return z
      .object({ serviceType: z.string().trim().min(1).max(50) })
      .strict()
      .parse(body);
  if (
    /^\/api\/v1\/recommendations\/me\/(smart|match-score|suggest-neighborhoods|selected-neighborhood-properties)$/.test(
      path,
    )
  ) {
    return body === undefined ? undefined : weightsSchema.strict().parse(body);
  }
  if (path === "/api/v1/recommendations/me/selected-neighborhood")
    return z
      .object({ district: z.string().trim().min(1).max(100) })
      .strict()
      .parse(body);
  if (path === "/api/v1/ai/chat" && method === "POST")
    return z
      .object({ message: z.string().trim().min(1).max(500) })
      .strict()
      .parse(body);
  if (body !== undefined) throw new ApiError("Unexpected request body", 400);
  return undefined;
}
const profile = z.object({
  id: z.number().int().positive(),
  fullName: z.string(),
  email: z.email(),
  createdAt: z.string().nullable().optional(),
  notificationsEnabled: z.boolean().optional(),
});
function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !/password|token|secret|authorities|credentials/i.test(key))
        .map(([key, entry]) => [key, sanitize(entry)]),
    );
  return value;
}
export function safeBusinessResponse(
  path: string,
  method: string,
  data: unknown,
): unknown {
  if (method === "POST" && path === "/api/v1/payments/me/checkout") {
    const checkout = z
      .object({
        paymentId: z.number().int().positive(),
        serviceType: z.string().min(1).max(50),
        amount: z.number().int().positive(),
        currency: z.literal("SAR"),
        intentId: z.string().min(1),
        clientSecret: z.string().startsWith("pi_secret_"),
        expiresAt: z.string().min(1),
        givenId: z.string().min(1),
        metadata: z.record(z.string(), z.string()),
      })
      .strict()
      .safeParse(data);
    if (!checkout.success) throw new ApiError("Invalid payment checkout response", 502);
    // Moyasar's client secret is specifically issued for its browser payment
    // widget. Keep this single, validated field while sanitizing all other data.
    return checkout.data;
  }
  if (method === "GET" && path === "/api/v1/user/me") {
    const result = profile.safeParse(data);
    if (!result.success) throw new ApiError("Invalid profile response", 502);
    return { ...result.data, createdAt: result.data.createdAt ?? null };
  }
  if (method === "GET" && path === "/api/v1/user/admin/users") {
    const result = z.array(profile).safeParse(data);
    if (!result.success) throw new ApiError("Invalid admin response", 502);
    return result.data;
  }
  if (method === "GET" && path === "/api/v1/notification/me/unread-count") {
    const result = z
      .object({ unreadCount: z.number().int().nonnegative() })
      .safeParse(data);
    if (!result.success) throw new ApiError("Invalid notification count", 502);
    return result.data;
  }
  if (data !== null && typeof data !== "object" && typeof data !== "boolean")
    throw new ApiError("Invalid backend response", 502);
  return sanitize(data);
}
