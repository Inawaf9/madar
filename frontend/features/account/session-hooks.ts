"use client";
import { useSyncExternalStore } from "react";
import { getClientSession, isClientSessionResolved } from "@/lib/user-id";
const subscribe = (callback: () => void) => {
  window.addEventListener("madar-user-change", callback);
  return () => window.removeEventListener("madar-user-change", callback);
};
export function useSafeSession() {
  return useSyncExternalStore(subscribe, getClientSession, () => null);
}
export function useSessionResolved() {
  return useSyncExternalStore(subscribe, isClientSessionResolved, () => false);
}
// Query identity comes from the BFF session, never localStorage.
export function useCurrentUserId() {
  return useSafeSession()?.userId ?? null;
}
