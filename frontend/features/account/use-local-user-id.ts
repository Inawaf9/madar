"use client";
import { useSyncExternalStore } from "react";
import { getUserId, USER_ID_KEY } from "@/lib/user-id";
const subscribe = (callback: () => void) => {
  const storage = (event: StorageEvent) => { if (event.key === USER_ID_KEY || event.key === null) callback(); };
  window.addEventListener("storage", storage);
  window.addEventListener("madar-user-change", callback);
  return () => { window.removeEventListener("storage", storage); window.removeEventListener("madar-user-change", callback); };
};
const snapshot = () => { try { const raw = getUserId(); return raw && /^\d+$/.test(raw) && Number(raw) > 0 && Number(raw) <= 2147483647 ? Number(raw) : null; } catch { return null; } };
export function useLocalUserId() { return useSyncExternalStore(subscribe, snapshot, () => null); }
