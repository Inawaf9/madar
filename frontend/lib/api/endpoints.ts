import type {
  AccountInput, ApiResponse, CurrentHome, CurrentHomeInput, HousingPreference, HousingPreferenceInput,
  PlaceInput, PlacePreference, PropertyComparison, ComparisonInput, SavedProperty,
  SavedPropertyInput, UserResponse,
} from "@/lib/api/contracts";
import { apiRequest } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
async function optionalRecord<T>(request: Promise<T>, emptyMessage: string): Promise<T | null> {
  try { return await request; } catch (error) { if (error instanceof ApiError && error.status === 400 && error.backendMessage === emptyMessage) return null; throw error; }
}

const root = (feature: string, userId: number) => `/api/v1/${feature}/${userId}`;
export const api = {
  register: (body: AccountInput) => apiRequest<ApiResponse>("/api/v1/user/register", { method: "POST", body }),
  profile: {
    update: (userId: number, body: AccountInput) => apiRequest<ApiResponse>(`/api/v1/user/update/${userId}`, { method: "PUT", body }),
    remove: (userId: number) => apiRequest<ApiResponse>(`/api/v1/user/delete/${userId}`, { method: "DELETE" }),
    get: (userId: number, signal?: AbortSignal) => apiRequest<UserResponse>(`/api/v1/user/get/${userId}`, { signal }),
  },
  home: {
    get: (userId: number, signal?: AbortSignal) => optionalRecord(apiRequest<CurrentHome>(`${root("current-home/get-by-user", userId)}`, { signal }), "Current home not found for this user"),
    add: (userId: number, body: CurrentHomeInput) => apiRequest<ApiResponse>(`${root("current-home/add", userId)}`, { method: "POST", body }),
    update: (userId: number, id: number, body: CurrentHomeInput) => apiRequest<ApiResponse>(`/api/v1/current-home/update/${userId}/${id}`, { method: "PUT", body }),
    remove: (userId: number, id: number) => apiRequest<ApiResponse>(`/api/v1/current-home/delete/${userId}/${id}`, { method: "DELETE" }),
  },
  preferences: {
    get: (userId: number, signal?: AbortSignal) => optionalRecord(apiRequest<HousingPreference>(`${root("housing-preference/get-by-user", userId)}`, { signal }), "Housing preference not found"),
    add: (userId: number, body: HousingPreferenceInput) => apiRequest<ApiResponse>(`${root("housing-preference/add", userId)}`, { method: "POST", body }),
    update: (userId: number, id: number, body: HousingPreferenceInput) => apiRequest<ApiResponse>(`/api/v1/housing-preference/update/${userId}/${id}`, { method: "PUT", body }),
    remove: (userId: number, id: number) => apiRequest<ApiResponse>(`/api/v1/housing-preference/delete/${userId}/${id}`, { method: "DELETE" }),
  },
  places: {
    get: async (userId: number, signal?: AbortSignal) => {
      try { return await apiRequest<PlacePreference[]>(`${root("place-preference/get", userId)}`, { signal }); }
      catch (error) { if (error instanceof ApiError && error.status === 400 && error.backendMessage === "No places found for this user") return []; throw error; }
    },
    add: (userId: number, body: PlaceInput) => apiRequest<ApiResponse>(`${root("place-preference/add", userId)}`, { method: "POST", body }),
    update: (userId: number, id: number, body: PlaceInput) => apiRequest<ApiResponse>(`/api/v1/place-preference/update/${userId}/${id}`, { method: "PUT", body }),
    remove: (userId: number, id: number) => apiRequest<ApiResponse>(`/api/v1/place-preference/delete/${userId}/${id}`, { method: "DELETE" }),
    importance: (userId: number, id: number, importance: number) => apiRequest<ApiResponse>(`/api/v1/place-preference/importance/${userId}/${id}/${importance}`, { method: "PATCH" }),
  },
  savedProperties: {
    get: async (userId: number, signal?: AbortSignal) => {
      try { return await apiRequest<SavedProperty[]>(`${root("saved-property/get", userId)}`, { signal }); }
      catch (error) { if (error instanceof ApiError && error.status === 400 && error.backendMessage === "No saved properties found for this user") return []; throw error; }
    },
    add: (userId: number, body: SavedPropertyInput) => apiRequest<ApiResponse>(`${root("saved-property/add", userId)}`, { method: "POST", body }),
    remove: (userId: number, id: number) => apiRequest<ApiResponse>(`/api/v1/saved-property/delete/${userId}/${id}`, { method: "DELETE" }),
  },
  comparisons: {
    detail: (userId: number, id: number, signal?: AbortSignal) => apiRequest<PropertyComparison>(`/api/v1/property-comparison/get-by-id/${userId}/${id}`, { signal }),
    get: (userId: number, signal?: AbortSignal) => apiRequest<PropertyComparison[]>(`${root("property-comparison/get-by-user", userId)}`, { signal }),
    add: (userId: number, body: ComparisonInput) => apiRequest<ApiResponse>(`${root("property-comparison/add", userId)}`, { method: "POST", body }),
    update: (userId: number, id: number, body: ComparisonInput) => apiRequest<ApiResponse>(`/api/v1/property-comparison/update/${userId}/${id}`, { method: "PUT", body }),
    remove: (userId: number, id: number) => apiRequest<ApiResponse>(`/api/v1/property-comparison/delete/${userId}/${id}`, { method: "DELETE" }),
  },
};
