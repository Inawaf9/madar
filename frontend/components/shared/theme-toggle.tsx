"use client";
import { useHydrated } from "@/hooks/use-hydrated";

import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";

const themes = ["light", "dark", "system"] as const;

export function ThemeToggle({ onHero = false }: { onHero?: boolean }) {
  const { theme, setTheme } = useTheme();
  const reduced = useReducedMotion();
  const mounted = useHydrated();
  const t = useTranslations("Navigation");

  const current =
    mounted && themes.includes(theme as (typeof themes)[number]) ? theme : "light";
  const Icon = current === "dark" ? Moon : current === "system" ? Monitor : Sun;
  const label =
    current === "dark" ? t("dark") : current === "system" ? t("system") : t("light");

  const nextTheme =
    themes[(themes.indexOf(current as (typeof themes)[number]) + 1) % themes.length];
  const nextLabel =
    nextTheme === "dark" ? t("dark") : nextTheme === "system" ? t("system") : t("light");

  return (
    <motion.div whileTap={reduced ? undefined : { scale: 0.96 }}>
      <Button
        type="button"
        onClick={() => setTheme(nextTheme)}
        variant={onHero ? "photo" : "outline"}
        size="icon-lg"
        className="size-10 rounded-full"
        aria-label={`${t("theme")}: ${label} → ${nextLabel}`}
        title={`${t("theme")}: ${label}`}
      >
        <AnimatePresence
          mode="wait"
          initial={false}
        >
          <motion.span
            key={current}
            initial={{ opacity: 0, rotate: -35, scale: 0.7 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 35, scale: 0.7 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
          >
            <Icon aria-hidden="true" />
          </motion.span>
        </AnimatePresence>
      </Button>
    </motion.div>
  );
}
