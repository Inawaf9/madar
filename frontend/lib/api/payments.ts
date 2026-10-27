import { apiRequest, apiGet as get } from "./client";
import type {
  CommuteReport,
  Checkout,
  Payment,
  FeatureAccess,
} from "./discovery-contracts";

export const payments = {
  access: (signal?: AbortSignal) =>
    get<FeatureAccess>(`/api/v1/payments/me/access/COMMUTE_REPORT`, {}, signal),
  checkout: (key: string, serviceType = "COMMUTE_REPORT") =>
    apiRequest<Checkout>(`/api/v1/payments/me/checkout`, {
      method: "POST",
      headers: { "Idempotency-Key": key },
      body: { serviceType },
    }),
  verify: (paymentId: number, signal?: AbortSignal) =>
    apiRequest<Payment>(`/api/v1/payments/me/${paymentId}/verify`, {
      method: "POST",
      signal,
    }),
  history: (status?: string, signal?: AbortSignal) =>
    get<Payment[]>(`/api/v1/payments/me`, { status }, signal),
  commute: (latitude: number, longitude: number, signal?: AbortSignal) =>
    get<CommuteReport>(
      `/api/v1/place-preference/me/commutes`,
      { latitude, longitude },
      signal,
    ),
};
