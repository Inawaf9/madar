"use client";
import { useQuery } from "@tanstack/react-query";
import { discovery } from "@/lib/api/discovery";
export function useProperty(source: string, id: string) {
  return useQuery({ queryKey: ["property", source, id], queryFn: ({ signal }) => discovery.detail(source, id, signal), retry: false, enabled: !!source && !!id && id !== "null" });
}
