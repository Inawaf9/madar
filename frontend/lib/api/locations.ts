import { z } from "zod";
import { apiRequest } from "./client";
import { ApiError } from "./errors";

export const citySchema = z.object({ slug: z.string().regex(/^[a-z_]+$/), nameAr: z.string(), nameEn: z.string() });
export const neighborhoodSchema = z.object({ id: z.number().int().min(-2147483648).max(2147483647), slug: z.string(), nameAr: z.string(), nameEn: z.string() });
export type LocationCity = z.infer<typeof citySchema>;
export type LocationNeighborhood = z.infer<typeof neighborhoodSchema>;

export const locationCatalogSchema = z.array(citySchema);
export type LocationCatalog = z.infer<typeof locationCatalogSchema>;
async function cityCatalog(signal?: AbortSignal): Promise<LocationCatalog> {
  let response: Response;
  try { response = await fetch("/api/property-locations", { signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(60_000)]) : AbortSignal.timeout(60_000), cache: "no-store" }); }
  catch (error) { if (signal?.aborted) throw error; throw new ApiError("Location catalog unavailable", 503); }
  if (!response.ok) throw new ApiError("Location catalog request failed", response.status);
  let payload: unknown;
  try { payload = await response.json(); } catch { throw new ApiError("Invalid location catalog response", 502); }
  const parsed = locationCatalogSchema.safeParse(payload);
  if (!parsed.success) throw new ApiError("Invalid location catalog response", 502);
  return parsed.data;
}

async function catalog<T>(path: string, schema: z.ZodType<T>, signal?: AbortSignal): Promise<T> {
  const parsed = schema.safeParse(await apiRequest<unknown>(path, { signal }));
  if (!parsed.success) throw new ApiError("Invalid location catalog response", 502);
  return parsed.data;
}
export const locations = {
  catalog: cityCatalog,
  cities: (signal?: AbortSignal) => catalog("/api/v1/locations/cities", z.array(citySchema), signal),
  neighborhoods: (city: string, signal?: AbortSignal) => catalog(`/api/v1/locations/cities/${encodeURIComponent(city)}/neighborhoods`, z.array(neighborhoodSchema), signal),
};

/** Only the documented numeric property-search parameter is accepted here. */
export function isSearchNeighborhoodId(value: string): boolean {
  return /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) <= 2147483647;
}
export function locationLabel(location: { nameAr: string; nameEn: string; slug: string }, locale: string) {
  const preferred = locale === "ar" ? location.nameAr : location.nameEn;
  const alternate = locale === "ar" ? location.nameEn : location.nameAr;
  return preferred.trim() ? preferred : alternate.trim() ? alternate : location.slug;
}
