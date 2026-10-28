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

  if (
      (method === "POST" || method === "PUT") &&
      (
          path === "/api/v1/credit-packages" ||
          /^\/api\/v1\/credit-packages\/[1-9]\d*$/.test(path)
      )
  ) {
    const schema = z.object({
      code: z.string().trim().min(1).max(50),
      name: z.string().trim().min(1).max(100),
      credits: z.number().int().positive(),
      priceHalalas: z.number().int().min(100),
      discountPercent: z.number().int().min(0).max(100),
      active: z.boolean(),
    }).strict().refine(
        (value) =>
            Math.floor(
                value.priceHalalas * (100 - value.discountPercent) / 100
            ) >= 100,
        { message: "Final price must be at least 1 SAR" }
    );

    return schema.parse(body);
  }

  if (
      method === "POST" &&
      /^\/api\/v1\/user\/admin\/users\/[1-9]\d*\/gift-credits$/.test(path)
  ) {
    if (body !== undefined) {
      throw new ApiError("Unexpected request body", 400);
    }
    return undefined;
  }

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
    const adminUserSchema = z.object({
      id: z.number().int().positive(),
      fullName: z.string(),
      email: z.string().email(),
      role: z.string(),
      active: z.boolean(),
      suspendedByAdmin: z.boolean(),
    });

    const adminUsersPageSchema = z.object({
      content: z.array(adminUserSchema),
      totalElements: z.number().int().nonnegative(),
      totalPages: z.number().int().nonnegative(),
      number: z.number().int().nonnegative(),
      size: z.number().int().nonnegative(),
    });

    const result = adminUsersPageSchema.safeParse(data);

    if (!result.success) {
      if (process.env.NODE_ENV !== "production") {
        console.error(
            "[MADAR ADMIN] Invalid users response:",
            result.error.issues,
        );
      }

      throw new ApiError("Invalid admin users response", 502);
    }

    return sanitize(data);
  }

  if (
      method === "GET" &&
      (
          path === "/api/v1/user/admin/payments" ||
          /^\/api\/v1\/user\/admin\/payments\/[1-9]\d*$/.test(path)
      )
  ) {
    const paymentSchema = z.object({
      id: z.number().int().positive(),
      serviceType: z.string(),
      amount: z.number().int().nonnegative(),
      currency: z.string(),
      status: z.string(),
      createdAt: z.string().nullable(),
      paidAt: z.string().nullable(),
      accessExpiresAt: z.string().nullable(),
      refundedAmount: z.number().int().nonnegative().nullable(),
    });

    const result =
        path === "/api/v1/user/admin/payments"
            ? z.object({
              content: z.array(paymentSchema),
              totalElements: z.number().int().nonnegative(),
              totalPages: z.number().int().nonnegative(),
              number: z.number().int().nonnegative(),
              size: z.number().int().nonnegative(),
            }).passthrough().safeParse(data)
            : paymentSchema.safeParse(data);

    if (!result.success) {
      throw new ApiError("Invalid admin payments response", 502);
    }

    return sanitize(data);
  }

  if (method === "GET" && path === "/api/v1/credit-packages") {
    const packageSchema = z.object({
      id: z.number().int().positive(),
      code: z.string(),
      name: z.string(),
      credits: z.number().int().positive(),
      priceHalalas: z.number().int().nonnegative(),
      discountPercent: z.number().int().min(0).max(100),
      active: z.boolean(),
    });

    const result = z.array(packageSchema).safeParse(data);

    if (!result.success) {
      throw new ApiError("Invalid credit packages response", 502);
    }

    return sanitize(data);
  }

  if (method === "GET" && path === "/api/v1/notification/me/unread-count") {
    const result = z
      .object({ unreadCount: z.number().int().nonnegative() })
      .safeParse(data);
    if (!result.success) throw new ApiError("Invalid notification count", 502);
    return result.data;
  }

  if (
      method === "GET" &&
      path === "/api/v1/user/admin/dashboard"
  ) {
    const dashboardSchema = z.object({
      totalUsers: z.number().int().nonnegative(),
      activeUsers: z.number().int().nonnegative(),
      inactiveUsers: z.number().int().nonnegative(),
      suspendedUsers: z.number().int().nonnegative(),
      newUsersLast30Days: z.number().int().nonnegative(),

      totalPayments: z.number().int().nonnegative(),
      paidPayments: z.number().int().nonnegative(),
      pendingPayments: z.number().int().nonnegative(),
      failedPayments: z.number().int().nonnegative(),
      refundedPayments: z.number().int().nonnegative(),

      paidAmountHalalas: z.number().nonnegative(),

      monthlyRegistrations: z.array(
          z.object({
            month: z.string(),
            registrations: z.number().int().nonnegative(),
          })
      ),
    });

    const result = dashboardSchema.safeParse(data);

    if (!result.success) {
      if (process.env.NODE_ENV !== "production") {
        console.error(
            "[MADAR ADMIN] Invalid dashboard response:",
            result.error.issues
        );
      }

      throw new ApiError("Invalid admin dashboard response", 502);
    }

    return sanitize(data);
  }

  if (
      method === "GET" &&
      path === "/api/v1/user/admin/audit-logs"
  ) {
    const auditLogSchema = z.object({
      id: z.number().int().positive(),
      adminId: z.number().int().positive(),
      targetUserId: z.number().int().positive().nullable(),
      action: z.string(),
      details: z.string().nullable(),
      createdAt: z.string(),
    });

    const result = z.object({
      content: z.array(auditLogSchema),
      totalElements: z.number().int().nonnegative(),
      totalPages: z.number().int().nonnegative(),
      number: z.number().int().nonnegative(),
      size: z.number().int().nonnegative(),
    }).safeParse(data);

    if (!result.success) {
      throw new ApiError("Invalid admin audit logs response", 502);
    }

    return sanitize(data);
  }

  if (
      method === "GET" &&
      path === "/api/v1/user/admin/system-health"
  ) {
    const serviceSchema = z.object({
      status: z.string(),
      message: z.string(),
      responseTimeMs: z.number().nonnegative().nullable(),
      checkedAt: z.string(),
    });

    const result = z.object({
      status: z.string(),
      checkedAt: z.string(),
      cacheDurationSeconds: z.number(),
      totalServices: z.number(),
      upServices: z.number(),
      downServices: z.number(),
      degradedServices: z.number(),
      unverifiedServices: z.number(),
      services: z.record(z.string(), serviceSchema),
    }).safeParse(data);

    if (!result.success) {
      throw new ApiError("Invalid admin system health response", 502);
    }

    return sanitize(data);
  }

  if (data !== null && typeof data !== "object" && typeof data !== "boolean")
    throw new ApiError("Invalid backend response", 502);
  return sanitize(data);
}
