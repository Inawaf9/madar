"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function LanguageSwitcher({ onHero = false }: { onHero?: boolean }) {
  return <Suspense fallback={<Skeleton className="h-10 w-32 rounded-full" />}><LanguageSwitcherContent onHero={onHero} /></Suspense>;
}

function LanguageSwitcherContent({ onHero = false }: { onHero?: boolean }) {
  const locale = useLocale();
  const reduced = useReducedMotion();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("Navigation");
  const nextLocale = locale === "ar" ? "en" : "ar";

  return (
    <motion.div whileTap={reduced ? undefined : { scale: 0.98 }}>
    <Button
      type="button"
      onClick={() => router.replace(`${pathname}${window.location.search}${window.location.hash}`, { locale: nextLocale })}
      variant={onHero ? "photo" : "ghost"}
      size="lg"
      className="h-10 rounded-full px-3"
      aria-label={t("switchLanguage")}
      lang={nextLocale}
    >
      <Languages aria-hidden="true" data-icon="inline-start" />
      <span>{t("switchLanguage")}</span>
    </Button>
    </motion.div>
  );
}
