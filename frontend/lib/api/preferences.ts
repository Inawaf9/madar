import type { ApiResponse, HousingPreference, HousingPreferenceInput } from "./contracts";
import { apiRequest } from "./client";
import { optionalRecord } from "./optional-record";
import { housingPreferenceRequest } from "./resource-requests";
export const preferencesApi = {
  get: async (signal?: AbortSignal) => {
    const value = await optionalRecord(
      apiRequest<Omit<HousingPreference, "interests">>("/api/v1/housing-preference/me", {
        signal,
      }),
      "Housing preference not found",
    );
    return value
      ? {
          ...value,
          interests: (value.lifestyleInterests ?? [])
            .filter((item) => item.active === true)
            .map((item) => item.code),
        }
      : null;
  },
  add: (body: HousingPreferenceInput) =>
    apiRequest<ApiResponse>("/api/v1/housing-preference/me", {
      method: "POST",
      body: housingPreferenceRequest(body),
    }),
  update: (preferenceId: number, body: HousingPreferenceInput) =>
    apiRequest<ApiResponse>(`/api/v1/housing-preference/me/${preferenceId}`, {
      method: "PUT",
      body: housingPreferenceRequest(body),
    }),
  remove: (preferenceId: number) =>
    apiRequest<ApiResponse>(`/api/v1/housing-preference/me/${preferenceId}`, {
      method: "DELETE",
    }),
};
