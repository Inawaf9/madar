import "server-only";
import { cacheLife } from "next/cache";
import { z } from "zod";
import { API_BASE_URL_ENV } from "@/lib/api/config";
import { ApiError } from "@/lib/api/errors";
import { citySchema, neighborhoodSchema, type LocationCatalog } from "@/lib/api/locations";

/** Shared by streamed search preloading and the frontend catalog BFF. No user data. */
export async function getLocationCatalog(formatVersion: 2): Promise<LocationCatalog> {
  "use cache";
  cacheLife({ stale: 600, revalidate: 600, expire: 1200 });
  if (formatVersion !== 2) throw new ApiError("Unsupported city catalog format", 500);
  const origin = new URL(process.env[API_BASE_URL_ENV] || "http://localhost:8080");
  if (!["http:", "https:"].includes(origin.protocol)) throw new ApiError("Invalid backend origin", 500);
  let response: Response;
  try {
    response = await fetch(`${origin.origin}${origin.pathname.replace(/\/$/, "")}/api/v1/locations/cities`, {
      headers: { Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(60_000),
    });
  } catch { throw new ApiError("Location catalog unavailable", 503); }
  if (!response.ok) throw new ApiError("Location catalog request failed", response.status);
  let payload: unknown;
  try { payload = await response.json(); } catch { throw new ApiError("Invalid location response", 502); }
  const parsed = z.array(citySchema).safeParse(payload);
  if (!parsed.success) throw new ApiError("Invalid location response", 502);
  return parsed.data;
}


export async function getCityNeighborhoods(city: string) {
  "use cache";
  cacheLife({ stale: 600, revalidate: 600, expire: 1200 });
  const catalog = await getLocationCatalog(2);
  if (!catalog.some(item => item.slug === city)) throw new ApiError("City not found", 404);
  const origin = new URL(process.env[API_BASE_URL_ENV] || "http://localhost:8080");
  if (!["http:", "https:"].includes(origin.protocol)) throw new ApiError("Invalid backend origin", 500);
  let response: Response;
  try { response = await fetch(`${origin.origin}${origin.pathname.replace(/\/$/, "")}/api/v1/locations/cities/${encodeURIComponent(city)}/neighborhoods`, { headers: { Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(60_000) }); }
  catch { throw new ApiError("Location catalog unavailable", 503); }
  if (!response.ok) throw new ApiError("Location catalog request failed", response.status);
  let payload: unknown;
  try { payload = await response.json(); } catch { throw new ApiError("Invalid location response", 502); }
  const parsed = z.array(neighborhoodSchema).safeParse(payload);
  if (!parsed.success) throw new ApiError("Invalid location response", 502);
  return parsed.data;
}
