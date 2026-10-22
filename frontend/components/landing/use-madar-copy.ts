import { useLocale } from "next-intl";

export function useMadarCopy() {
  const locale = useLocale();
  return { locale, ar: locale === "ar", text: (arabic: string, english: string) => locale === "ar" ? arabic : english };
}
