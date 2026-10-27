import type { ApiResponse, LifestyleInterest, LifestyleInterestInput } from "./contracts";
import { apiRequest } from "./client";
import { lifestyleInterestRequest } from "./resource-requests";
export const lifestyleApi = {
  get: (signal?: AbortSignal) =>
    apiRequest<LifestyleInterest[]>("/api/v1/lifestyle-interest/me", { signal }),
  add: (body: LifestyleInterestInput) =>
    apiRequest<ApiResponse>("/api/v1/lifestyle-interest/me", {
      method: "POST",
      body: lifestyleInterestRequest(body),
    }),
  update: (interestId: number, body: LifestyleInterestInput) =>
    apiRequest<ApiResponse>(`/api/v1/lifestyle-interest/me/${interestId}`, {
      method: "PUT",
      body: lifestyleInterestRequest(body),
    }),
  remove: (interestId: number) =>
    apiRequest<ApiResponse>(`/api/v1/lifestyle-interest/me/${interestId}`, {
      method: "DELETE",
    }),
};
/** Preserve selection UX through the dedicated resource API. Each retry diffs fresh server state. */
export async function saveSelectedInterests(codes: string[]) {
  const selected = new Set(codes);
  const existing = await lifestyleApi.get();
  for (const item of existing) {
    const active = selected.has(item.code);
    if (item.active !== active)
      await lifestyleApi.update(item.id, { code: item.code, active });
  }
  for (const code of selected)
    if (!existing.some((item) => item.code === code)) await lifestyleApi.add({ code });
}
