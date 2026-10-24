import { apiRequest, apiGet as get } from "./client";
import type { CommuteReport, Checkout, Payment, FeatureAccess } from "./discovery-contracts";

export const payments = {
  access: (id: number, signal?: AbortSignal) => get<FeatureAccess>(`/api/v1/payments/${id}/access/COMMUTE_REPORT`, {}, signal),
  checkout: (id: number, key: string) => apiRequest<Checkout>(`/api/v1/payments/${id}/checkout`, { method: "POST", headers: { "Idempotency-Key": key }, body: { serviceType: "COMMUTE_REPORT" } }),
  verify: (id: number, paymentId: number, signal?: AbortSignal) => get<Payment>(`/api/v1/payments/${id}/${paymentId}/verify`, {}, signal),
  history: (id: number, status?: string, signal?: AbortSignal) => get<Payment[]>(`/api/v1/payments/${id}`, { status }, signal),
  commute: (id: number, latitude: number, longitude: number, signal?: AbortSignal) => get<CommuteReport>(`/api/v1/place-preference/calculate-commutes/${id}`, { latitude, longitude }, signal),
};
