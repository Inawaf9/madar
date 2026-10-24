"use client";
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { locationCatalogKey, locationCatalogOptions } from "@/lib/api/location-query-options";

/** Navigation intent only; no global mount-time requests or all-city neighborhood fan-out. */
export function usePrefetchLocations() {
  const client = useQueryClient();
  return useCallback(() => {
    const current = client.getQueryState(locationCatalogKey);
    if (current?.status === "error" && Date.now() - current.errorUpdatedAt < 15_000) return;
    void client.prefetchQuery(locationCatalogOptions());
  }, [client]);
}
