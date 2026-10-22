"use client";
export const USER_ID_KEY = "madar_user_id";
export function saveUserId(userId: number | string) {
  if (typeof window === "undefined") return;
  const value = String(userId);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) <= 0 || Number(value) > 2147483647) throw new Error("Invalid local user identifier");
  localStorage.setItem(USER_ID_KEY, value);
  window.dispatchEvent(new Event("madar-user-change"));
}
export function getUserId(): string | null {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem(USER_ID_KEY); } catch { return null; }
}
export function clearUserId() {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(USER_ID_KEY); } catch { /* Storage can be unavailable in privacy-restricted contexts. */ }
  window.dispatchEvent(new Event("madar-user-change"));
}
