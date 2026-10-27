"use client";

import Image from "next/image";
import { ArrowDown, ArrowUpLeft } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { motion, useReducedMotion } from "motion/react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import {
  CuratedDisplayText,
  displayHeadingVariants,
} from "@/components/typography/display-heading";

const contentReveal = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
};
const MotionLink = motion.create(Link);

export function PropertyDiscoveryHero() {
  const t = useTranslations("Hero");
  const ar = useLocale() === "ar";
  const reduceMotion = useReducedMotion();
  const title = t("title").split("\n");

  return (
    <section className="relative isolate overflow-hidden bg-background py-12 text-foreground sm:py-16 lg:py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-3/4 bg-gradient-to-b from-secondary/35 via-background to-background"
      />
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14 lg:px-12">
        <motion.div
          className="min-w-0"
          initial={reduceMotion ? false : "hidden"}
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.13, delayChildren: 0.12 } },
          }}
        >
          <motion.p
            variants={contentReveal}
            transition={{ duration: reduceMotion ? 0 : 0.5 }}
            className="mb-5 flex items-center gap-3 text-sm font-medium text-accent-ink"
          >
            <span
              aria-hidden="true"
              className="h-px w-10 bg-accent"
            />
            {t("eyebrow")}
          </motion.p>
          <motion.h2
            variants={contentReveal}
            transition={{ duration: reduceMotion ? 0 : 0.65 }}
            className={displayHeadingVariants({ variant: "hero" })}
          >
            {title.map((line, index) => (
              <span
                key={index}
                className="block"
              >
                <CuratedDisplayText
                  text={line}
                  enabled={ar && index === 0}
                />
              </span>
            ))}
          </motion.h2>
          <motion.p
            variants={contentReveal}
            transition={{ duration: reduceMotion ? 0 : 0.65 }}
            className="mt-5 max-w-lg text-base leading-8 text-muted-foreground"
          >
            {t("description")}
          </motion.p>
          <motion.div
            variants={contentReveal}
            transition={{ duration: reduceMotion ? 0 : 0.5 }}
            className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap"
          >
            <MotionLink
              href="/properties"
              whileHover={reduceMotion ? undefined : { y: -2 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              className={buttonVariants({
                size: "lg",
                className: "w-full px-7 sm:w-auto",
              })}
            >
              {t("primaryCta")}
              <ArrowUpLeft
                aria-hidden="true"
                data-icon="inline-end"
                className="rtl:-scale-x-100"
              />
            </MotionLink>
            <motion.a
              href="#how-it-works"
              whileHover={reduceMotion ? undefined : { y: -2 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              className={buttonVariants({
                variant: "outline",
                size: "lg",
                className: "w-full px-7 sm:w-auto",
              })}
            >
              {t("secondaryCta")}
              <ArrowDown
                aria-hidden="true"
                data-icon="inline-end"
              />
            </motion.a>
          </motion.div>
        </motion.div>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.75, delay: 0.25 }}
          className="relative min-w-0 overflow-hidden rounded-3xl border border-border bg-card shadow-stone"
        >
          <div className="relative aspect-[4/3] overflow-hidden sm:aspect-[5/4] lg:aspect-[4/5]">
            <Image
              src="/hero.png"
              alt={t("imageAlt")}
              fill
              sizes="(min-width: 1280px) 580px, (min-width: 1024px) calc((100vw - 152px) * 0.55), (min-width: 640px) calc(100vw - 64px), calc(100vw - 40px)"
              className="object-cover object-center"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
