"use client";
import type { SafeSession } from "@/lib/auth/contracts";
// Presentation cache only. Every data boundary independently authorizes on the server.
let identity: SafeSession | null = null;
let sessionResolved = false;
export function setClientSession(value: SafeSession | null) {
  identity = value;
  sessionResolved = true;
  window.dispatchEvent(new Event("madar-user-change"));
}
export function getClientSession() {
  return identity;
}
export function isClientSessionResolved() {
  return sessionResolved;
}
export function markClientSessionResolved() {
  if (sessionResolved) return;
  sessionResolved = true;
  window.dispatchEvent(new Event("madar-user-change"));
}
export function getUserId(): string | null {
  return identity ? String(identity.userId) : null;
}
export function clearPrivateBrowserData() {
  try {
    for (let index = sessionStorage.length - 1; index >= 0; index--) {
      const key = sessionStorage.key(index);
      if (key && /^(madar-payment:|madar-payment-origin:|madar-checkout-key:)/.test(key))
        sessionStorage.removeItem(key);
    }
  } catch {
    /* Browser storage may be disabled. */
  }
}
export function clearUserId() {
  clearPrivateBrowserData();
  setClientSession(null);
}
