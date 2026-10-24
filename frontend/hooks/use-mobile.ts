"use client";

import { useSyncExternalStore } from "react";

const MOBILE_QUERY = "(max-width: 767px)";
const subscribe = (onChange: () => void) => {
  const media = window.matchMedia(MOBILE_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};
const snapshot = () => window.matchMedia(MOBILE_QUERY).matches;
const serverSnapshot = () => false;

export function useIsMobile() {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
