import "server-only";
import { cacheLife } from "next/cache";
import { z } from "zod";
import { publicBackend } from "@/lib/api/backend.server";
import { ApiError } from "@/lib/api/errors";
import {
  citySchema,
  neighborhoodSchema,
  type LocationCatalog,
} from "@/lib/api/locations";

/** Shared by streamed search preloading and the frontend catalog BFF. No user data. */
export async function getLocationCatalog(formatVersion: 2): Promise<LocationCatalog> {
  "use cache";
  cacheLife({ stale: 600, revalidate: 600, expire: 1200 });
  if (formatVersion !== 2) throw new ApiError("Unsupported city catalog format", 500);
  const payload = await publicBackend("/api/v1/locations/cities");
  const parsed = z.array(citySchema).safeParse(payload);
  if (!parsed.success) throw new ApiError("Invalid location response", 502);
  return parsed.data;
}

export async function getCityNeighborhoods(city: string) {
  "use cache";
  cacheLife({ stale: 600, revalidate: 600, expire: 1200 });
  const catalog = await getLocationCatalog(2);
  if (!catalog.some((item) => item.slug === city))
    throw new ApiError("City not found", 404);
  const payload = await publicBackend(
    `/api/v1/locations/cities/${encodeURIComponent(city)}/neighborhoods`,
  );
  const parsed = z.array(neighborhoodSchema).safeParse(payload);
  if (!parsed.success) throw new ApiError("Invalid location response", 502);
  return parsed.data;
}
