import { csrfHeaders } from "@/lib/auth/client";
import { serializeQuery } from "./query";
import { ApiError } from "./errors";
import { BACKEND_PROXY_PREFIX } from "./config";

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(new DOMException("Request timed out", "TimeoutError")),
    60_000,
  );
  const signal = options.signal
    ? AbortSignal.any([controller.signal, options.signal])
    : controller.signal;
  try {
    const csrf =
      (options.method && options.method !== "GET") ||
      /^\/api\/v1\/payments\/me\/\d+\/verify(?:\?|$)/.test(path)
        ? await csrfHeaders()
        : {};
    const response = await fetch(`${BACKEND_PROXY_PREFIX}${path}`, {
      ...options,
      signal,
      cache: "no-store",
      headers: {
        ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...options.headers,
        ...csrf,
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const raw = response.status === 204 ? "" : await response.text();
    let payload: unknown = undefined;
    if (raw) {
      try {
        payload = JSON.parse(raw) as unknown;
      } catch {
        payload = raw;
      }
    }
    if (!response.ok) {
      if (response.status === 401 && typeof window !== "undefined")
        window.dispatchEvent(new Event("madar-session-ended"));
      const message =
        typeof payload === "object" &&
        payload !== null &&
        "message" in payload &&
        typeof payload.message === "string"
          ? payload.message
          : typeof payload === "string"
            ? payload
            : undefined;
      throw new ApiError("Backend request failed", response.status, message);
    }
    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (options.signal?.aborted) throw error;
    if (controller.signal.aborted) throw new ApiError("Request timed out", 408);
    throw new ApiError("Backend is unavailable", 503);
  } finally {
    clearTimeout(timeout);
  }
}

/** Shared GET query serialization; domain clients retain their exact DTOs. */
export function apiGet<T>(
  path: string,
  params: object = {},
  signal?: AbortSignal,
): Promise<T> {
  const query = Object.keys(params).length ? `?${serializeQuery(params)}` : "";
  return apiRequest<T>(`${path}${query}`, { signal });
}
