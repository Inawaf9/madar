"use client";
import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@/i18n/navigation";
import {
  getClientSession,
  setClientSession,
  clearPrivateBrowserData,
  markClientSessionResolved,
} from "@/lib/user-id";
import { safeSessionSchema } from "@/lib/auth/contracts";
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const cache = useQueryClient();
  const router = useRouter();
  const generation = useRef(0);
  const sync = useCallback(async () => {
    const epoch = ++generation.current;
    try {
      const response = await fetch("/api/auth/session", {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (response.status === 401) {
        window.dispatchEvent(new Event("madar-session-ended"));
        return;
      }
      if (!response.ok) return; // Backend outages are not evidence of logout.
      const data = await response.json();
      const next = data === null ? null : safeSessionSchema.parse(data);
      if (epoch !== generation.current) return;
      const previous = getClientSession();
      if (JSON.stringify(previous) !== JSON.stringify(next)) {
        setClientSession(null);
        clearPrivateBrowserData();
        await cache.cancelQueries();
        cache.clear();
        if (epoch !== generation.current) return;
        setClientSession(next);
        router.refresh();
      }
      markClientSessionResolved();
    } catch {
      /* Keep the existing UI on transient network failure; the server fails closed. */
    }
  }, [cache, router]);
  useEffect(() => {
    let channel: BroadcastChannel | undefined;
    try {
      channel = new BroadcastChannel("madar-auth");
      channel.onmessage = () => void sync();
    } catch {
      /* Focus/poll remain available. */
    }
    const ended = () => {
      ++generation.current;
      setClientSession(null);
      clearPrivateBrowserData();
      void cache.cancelQueries().then(() => cache.clear());
      router.refresh();
    };
    const changed = () => {
      ++generation.current;
    };
    const dispose = () => {
      ++generation.current;
    };
    const visible = () => {
      if (document.visibilityState === "visible") void sync();
    };
    void sync();
    const timer = window.setInterval(() => void sync(), 30_000);
    window.addEventListener("focus", visible);
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("madar-session-ended", ended);
    window.addEventListener("madar-auth-established", changed);
    return () => {
      dispose();
      channel?.close();
      clearInterval(timer);
      window.removeEventListener("focus", visible);
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("madar-session-ended", ended);
      window.removeEventListener("madar-auth-established", changed);
    };
  }, [sync, cache, router]);
  return children;
}
export function broadcastAuthChange() {
  window.dispatchEvent(new Event("madar-auth-established"));
  try {
    const channel = new BroadcastChannel("madar-auth");
    channel.postMessage("changed");
    channel.close();
  } catch {
    /* Focus/poll fallback. */
  }
}
