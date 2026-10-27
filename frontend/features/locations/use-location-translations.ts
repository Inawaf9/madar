"use client";
import { useMemo } from "react";
import { createTranslator, useLocale } from "next-intl";
import ar from "./messages/ar.json";
import en from "./messages/en.json";

/** Load feature messages with the client module, independently of retained layout RSC messages. */
export function useLocationTranslations() {
  const locale = useLocale();
  return useMemo(
    () => createTranslator({ locale, messages: locale === "ar" ? ar : en }),
    [locale],
  );
}
