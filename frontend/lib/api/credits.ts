import { z } from "zod";
import { apiGet } from "./client";
import { ApiError } from "./errors";

const walletBalanceSchema = z.object({
  balance: z.number().int().nonnegative(),
});

const creditPackageSchema = z.object({
  id: z.number().int().positive(),
  code: z.string().min(1),
  name: z.string().min(1),
  credits: z.number().int().positive(),
  priceHalalas: z.number().int().positive(),
  discountPercent: z.number().int().min(0).max(100),
  active: z.boolean(),
});

const creditTransactionSchema = z.object({
  id: z.number().int().positive(),
  type: z.string().min(1),
  amount: z.number().int(),
  balanceAfter: z.number().int().nonnegative(),
  description: z.string().nullable(),
  createdAt: z.string(),
});

const servicePricesSchema = z.record(z.string(), z.number().int().nonnegative());

export type CreditBalance = z.infer<typeof walletBalanceSchema>;
export type CreditPackage = z.infer<typeof creditPackageSchema>;
export type CreditTransaction = z.infer<typeof creditTransactionSchema>;
export type CreditServicePrices = z.infer<typeof servicePricesSchema>;

async function parseResponse<T>(
  request: Promise<unknown>,
  schema: z.ZodType<T>,
  label: string,
): Promise<T> {
  const response = await request;
  const parsed = schema.safeParse(response);
  if (!parsed.success) throw new ApiError(`Invalid ${label} response`, 502);
  return parsed.data;
}

export const credits = {
  balance: (signal?: AbortSignal) =>
    parseResponse(
      apiGet<unknown>("/api/v1/credits/me/balance", {}, signal),
      walletBalanceSchema,
      "credit balance",
    ),
  packages: (signal?: AbortSignal) =>
    parseResponse(
      apiGet<unknown>("/api/v1/credit-packages/active", {}, signal),
      z.array(creditPackageSchema),
      "credit packages",
    ),
  servicePrices: (signal?: AbortSignal) =>
    parseResponse(
      apiGet<unknown>("/api/v1/credits/prices", {}, signal),
      servicePricesSchema,
      "credit service pricing",
    ),
  transactions: (signal?: AbortSignal) =>
    parseResponse(
      apiGet<unknown>("/api/v1/credits/me/transactions", {}, signal),
      z.array(creditTransactionSchema),
      "credit transaction history",
    ),
};

/** The backend, not the browser, decides the amount charged for a package. */
export function packagePriceHalalas(item: CreditPackage): number {
  return Math.floor((item.priceHalalas * (100 - item.discountPercent)) / 100);
}
