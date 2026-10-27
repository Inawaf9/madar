"use client";
import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { inAppUrl, takePropertyOrigin } from "../property-navigation";

// Progressive enhancement: older browsers use the explicitly recorded origin URL.
type NavigationHistory = {
  currentEntry: { index: number } | null;
  entries: () => { url?: string | null }[];
};
export function PropertyBackButton() {
  const router = useRouter();
  const origin = useRef<URL | null>(null);
  useEffect(() => {
    origin.current ||= takePropertyOrigin();
  }, []);
  const goBack = () => {
    const navigation = (window as Window & { navigation?: NavigationHistory }).navigation;
    const index = navigation?.currentEntry?.index ?? -1;
    const previous = index > 0 ? inAppUrl(navigation?.entries()[index - 1]?.url) : null;
    if (previous) {
      router.back();
      return;
    }
    // A new tab has no preceding entry, even if its sessionStorage was copied.
    const target =
      window.history.length > 1 ? origin.current || inAppUrl(document.referrer) : null;
    if (target) {
      const [, locale, ...segments] = target.pathname.split("/");
      router.replace(`/${segments.join("/")}${target.search}${target.hash}`, {
        locale: locale as "ar" | "en",
      });
    } else router.replace("/properties");
  };
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="self-start"
      onClick={goBack}
    >
      <ArrowRight
        data-icon="inline-start"
        className="ltr:rotate-180"
      />
      العودة للنتائج
    </Button>
  );
}
