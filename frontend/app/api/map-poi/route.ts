import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { geoapifyCategories, poiCategorySchema, POI_LIMIT, POI_RADIUS_METERS, type MapPoi } from "@/lib/maps/poi";
import { validCoordinates } from "@/lib/maps/points";

const parameters = z.object({
  latitude: z.string().trim().min(1).transform(Number).pipe(z.number().min(-90).max(90)),
  longitude: z.string().trim().min(1).transform(Number).pipe(z.number().min(-180).max(180)),
  category: poiCategorySchema,
}).strict();
const featureSchema = z.object({ properties: z.object({
  place_id: z.string().min(1), lat: z.number(), lon: z.number(),
  name: z.string().nullish(), formatted: z.string().nullish(), categories: z.array(z.string()),
}) });
const responseSchema = z.object({ type: z.literal("FeatureCollection"), features: z.array(z.unknown()) });
const error = (message: string, code: string, status: number) => NextResponse.json({ message, code }, { status, headers: { "Cache-Control": "no-store" } });

/** Next.js-only Geoapify adapter. No Spring endpoint or Google contract changes. */
export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams;
  if (Array.from(search.keys()).some(key => search.getAll(key).length !== 1)) return error("معاملات البحث غير صالحة.", "INVALID_QUERY", 400);
  const parsed = parameters.safeParse(Object.fromEntries(search));
  if (!parsed.success) return error("اختر تصنيفًا وموقع عقار صالحين.", "INVALID_QUERY", 400);
  const key = process.env.GEOAPIFY_API_KEY?.trim();
  if (!key) return error("خدمات الخريطة لم تُفعّل بعد. تبقى قائمة Google متاحة.", "POI_NOT_CONFIGURED", 503);
  const { latitude, longitude, category } = parsed.data;
  const providerCategory = geoapifyCategories[category];
  const url = new URL("https://api.geoapify.com/v2/places");
  url.search = new URLSearchParams({ apiKey: key, categories: providerCategory, filter: `circle:${longitude},${latitude},${POI_RADIUS_METERS}`, bias: `proximity:${longitude},${latitude}`, limit: String(POI_LIMIT) }).toString();
  try {
    const upstream = await fetch(url, { cache: "no-store", signal: AbortSignal.any([request.signal, AbortSignal.timeout(12_000)]), headers: { Accept: "application/json" } });
    if (!upstream.ok) {
      // Do not log the URL, credentials or raw provider body.
      if (process.env.NODE_ENV === "development") console.warn("[map-poi] Geoapify rejected request", { status: upstream.status, category });
      const configuration = upstream.status === 401 || upstream.status === 403;
      return error("تعذّر تحميل الأماكن من المزوّد.", configuration ? "POI_PROVIDER_CONFIGURATION" : upstream.status === 429 ? "POI_RATE_LIMITED" : "POI_PROVIDER_FAILED", upstream.status === 429 ? 429 : 502);
    }
    const raw = responseSchema.safeParse(await upstream.json().catch(() => null));
    if (!raw.success) return error("تعذّر قراءة بيانات الأماكن.", "POI_INVALID_RESPONSE", 502);
    const places: MapPoi[] = [];
    const seen = new Set<string>();
    for (const feature of raw.data.features.slice(0, POI_LIMIT)) {
      const result = featureSchema.safeParse(feature);
      if (!result.success) continue;
      const p = result.data.properties;
      if (!validCoordinates(p.lat, p.lon) || seen.has(p.place_id) || !p.categories.some(c => c === providerCategory || c.startsWith(`${providerCategory}.`))) continue;
      seen.add(p.place_id);
      places.push({ id: p.place_id, name: p.name?.trim() || null, address: p.formatted?.trim() || null, latitude: p.lat, longitude: p.lon, category, provider: "geoapify" });
    }
    if (raw.data.features.length && !places.length) return error("لا تتوفر مواقع صالحة في استجابة الأماكن.", "POI_INVALID_RESPONSE", 502);
    return NextResponse.json({ provider: "geoapify", places }, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    const timeout = cause instanceof Error && cause.name === "TimeoutError";
    if (process.env.NODE_ENV === "development" && !request.signal.aborted) console.warn("[map-poi] Geoapify request failed", { category, reason: timeout ? "timeout" : "network" });
    return error("تعذّر تحميل الأماكن. أعد المحاولة.", timeout ? "POI_TIMEOUT" : "POI_NETWORK", timeout ? 504 : 502);
  }
}
