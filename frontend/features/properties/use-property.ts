"use client";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { apiLanguage } from "@/lib/api/config";
import { discovery } from "@/lib/api/discovery";
export function useProperty(source: string, id: string) {
  const language = apiLanguage(useLocale());
  return useQuery({
    queryKey: ["property", source, id, language],
    queryFn: ({ signal }) => discovery.detail(source, id, signal, language),
    retry: false,
    enabled: !!source && !!id && id !== "null",
  });
}
