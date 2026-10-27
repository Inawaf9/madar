export const BACKEND_PROXY_PREFIX = "/api/backend";
export const API_BASE_URL_ENV = "MADAR_BACKEND_BASE_URL";

export type ApiLanguage = "ar" | "en";
export const apiLanguage = (locale: string): ApiLanguage =>
  locale === "en" ? "en" : "ar";
