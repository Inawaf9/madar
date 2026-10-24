import { routing } from "@/i18n/routing";

const originKey = (path: string) => `madar:property-origin:${path}`;

/** Called only by Next Link's same-tab onNavigate event, never during rendering. */
export function rememberPropertyOrigin(detailPath: string) {
  const locale = window.location.pathname.split("/")[1];
  if (!routing.locales.some(value => value === locale)) return;
  try {
    sessionStorage.setItem(originKey(`/${locale}${detailPath}`), window.location.href);
  } catch { /* Browsing remains available if session storage is disabled. */ }
}

export function inAppUrl(value: string | undefined | null): URL | null {
  if (!value) return null;
  try {
    const url = new URL(value, window.location.origin);
    const locale = url.pathname.split("/")[1];
    return url.origin === window.location.origin && routing.locales.some(value => value === locale) && url.pathname !== window.location.pathname ? url : null;
  } catch { return null; }
}

export function takePropertyOrigin() {
  try {
    const key = originKey(window.location.pathname);
    const value = sessionStorage.getItem(key);
    sessionStorage.removeItem(key);
    return inAppUrl(value);
  } catch { return null; }
}
