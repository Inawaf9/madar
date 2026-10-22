"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher({ onHero = false }: { onHero?: boolean }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("Navigation");
  const nextLocale = locale === "ar" ? "en" : "ar";

  return (
    <motion.div whileTap={{ scale: 0.96 }}>
    <Button
      type="button"
      onClick={() => router.replace(`${pathname}${window.location.search}${window.location.hash}`, { locale: nextLocale })}
      variant="ghost"
      size="lg"
      className={`h-10 rounded-full px-3 ${onHero ? "text-white hover:bg-white/15 hover:text-white" : ""}`}
      aria-label={t("switchLanguage")}
      lang={nextLocale}
    >
      <Languages aria-hidden="true" data-icon="inline-start" />
      <span>{t("switchLanguage")}</span>
    </Button>
    </motion.div>
  );
}
