import { z } from "zod";
import { ApiError } from "./errors";
import { mapPoiResponseSchema, type PoiCategory } from "@/lib/maps/poi";
import { validCoordinates } from "@/lib/maps/points";

const errorCodeSchema = z.enum([
  "INVALID_QUERY",
  "POI_NOT_CONFIGURED",
  "POI_PROVIDER_CONFIGURATION",
  "POI_PROVIDER_FAILED",
  "POI_INVALID_RESPONSE",
  "POI_RATE_LIMITED",
  "POI_TIMEOUT",
  "POI_NETWORK",
  "POI_AUTH",
  "POI_BACKEND_UNAVAILABLE",
]);
type MapPoiErrorCode = z.infer<typeof errorCodeSchema>;
export class MapPoiError extends ApiError {
  constructor(
    readonly code: MapPoiErrorCode,
    status: number,
  ) {
    super(code, status);
    this.name = "MapPoiError";
  }
}

export function mapPoiErrorMessage(error: unknown, locale: string): string {
  const code = error instanceof MapPoiError ? error.code : "POI_PROVIDER_FAILED";
  const messages: Record<MapPoiErrorCode, [string, string]> = {
    INVALID_QUERY: [
      "لا تتوفر إحداثيات صالحة للبحث حول هذا العقار.",
      "This property has no valid coordinates for nearby search.",
    ],
    POI_NOT_CONFIGURED: [
      "خدمة الأماكن على الخريطة غير مفعّلة بعد. قائمة Google المنفصلة متاحة.",
      "Map places are not configured yet. The separate Google list is available.",
    ],
    POI_PROVIDER_CONFIGURATION: [
      "تعذّر الوصول إلى مزوّد الأماكن بسبب إعدادات الخدمة.",
      "The places provider could not be accessed due to service configuration.",
    ],
    POI_PROVIDER_FAILED: [
      "مزوّد الأماكن غير متاح حاليًا. حاول مجددًا.",
      "The places provider is unavailable. Please retry.",
    ],
    POI_INVALID_RESPONSE: [
      "تعذّر قراءة مواقع الأماكن من الاستجابة. حاول مجددًا.",
      "The places response could not be read. Please retry.",
    ],
    POI_RATE_LIMITED: [
      "بلغت خدمة الأماكن حد الطلبات. حاول لاحقًا.",
      "The places request limit was reached. Try again later.",
    ],
    POI_TIMEOUT: [
      "انتهت مهلة تحميل الأماكن. أعد المحاولة.",
      "Loading places timed out. Please retry.",
    ],
    POI_NETWORK: [
      "تعذّر الاتصال بخدمة الأماكن. تحقق من الاتصال وأعد المحاولة.",
      "Could not connect to places. Check your connection and retry.",
    ],
    POI_AUTH: [
      "لم يُسمح بطلب الأماكن. تحقق من صلاحية الوصول.",
      "The places request was not authorized. Check your access.",
    ],
    POI_BACKEND_UNAVAILABLE: [
      "خدمة الأماكن غير متاحة على الخادم حاليًا.",
      "The places service is currently unavailable on the server.",
    ],
  };
  return messages[code][locale === "ar" ? 0 : 1];
}

export async function getMapPois(
  latitude: number,
  longitude: number,
  category: PoiCategory,
  signal?: AbortSignal,
) {
  if (!validCoordinates(latitude, longitude)) throw new MapPoiError("INVALID_QUERY", 400);
  try {
    const response = await fetch(
      `/api/map-poi?${new URLSearchParams({ latitude: String(latitude), longitude: String(longitude), category })}`,
      {
        signal: signal
          ? AbortSignal.any([signal, AbortSignal.timeout(15_000)])
          : AbortSignal.timeout(15_000),
        cache: "no-store",
      },
    );
    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null);
      const parsed = z.object({ code: errorCodeSchema }).safeParse(body);
      const fallback: MapPoiErrorCode =
        response.status === 401 || response.status === 403
          ? "POI_AUTH"
          : response.status === 429
            ? "POI_RATE_LIMITED"
            : response.status >= 500
              ? "POI_BACKEND_UNAVAILABLE"
              : "POI_PROVIDER_FAILED";
      throw new MapPoiError(
        parsed.success ? parsed.data.code : fallback,
        response.status,
      );
    }
    const body: unknown = await response.json().catch(() => {
      throw new MapPoiError("POI_INVALID_RESPONSE", 502);
    });
    const parsed = mapPoiResponseSchema.safeParse(body);
    if (!parsed.success) throw new MapPoiError("POI_INVALID_RESPONSE", 502);
    return parsed.data;
  } catch (error) {
    if (signal?.aborted || error instanceof ApiError) throw error;
    throw new MapPoiError(
      error instanceof Error && error.name === "TimeoutError"
        ? "POI_TIMEOUT"
        : "POI_NETWORK",
      503,
    );
  }
}
