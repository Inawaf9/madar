"use client";

import { Link } from "@/i18n/navigation";

import { ArrowUpLeft, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { SectionHeading } from "./section-heading";

const MotionLink = motion.create(Link);

export function FinalCTASection() {
  const t = useTranslations("CTA");
  const locale = useLocale();
  const reduceMotion = useReducedMotion();
  const visualEntry = locale === "ar" ? -18 : 18;
  return (
    <section className="px-5 py-14 sm:px-8 sm:py-20 lg:px-12">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, scale: 0.985, y: 10 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={
          reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 88, damping: 22 }
        }
        className="relative mx-auto grid max-w-7xl items-center gap-5 overflow-hidden rounded-2xl border border-border bg-secondary px-5 py-7 text-secondary-foreground sm:px-10 sm:py-10 lg:grid-cols-[1fr_1fr] lg:gap-8 lg:px-14"
      >
        <div className="relative z-10 max-w-2xl">
          <p className="inline-flex items-center gap-2 text-xs font-medium text-secondary-foreground">
            <Sparkles
              aria-hidden="true"
              className="size-4 text-accent"
            />
            {t("eyebrow")}
          </p>
          <SectionHeading
            eyebrow=""
            title={t("title")}
            description={t("description")}
            className="mt-3"
            tone="secondary"
            editorial
          />
          <MotionLink
            whileHover={reduceMotion ? undefined : { y: -2 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            href="/properties"
            className={buttonVariants({ size: "lg", className: "mt-6 px-6" })}
          >
            {t("button")}
            <ArrowUpLeft
              aria-hidden="true"
              data-icon="inline-end"
              className="rtl:-scale-x-100"
            />
          </MotionLink>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">{t("note")}</p>
        </div>
        <motion.div
          aria-hidden="true"
          initial={reduceMotion ? false : { opacity: 0, x: visualEntry, scale: 0.97 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, x: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 0.75, delay: 0.12, ease: [0.22, 1, 0.36, 1] }
          }
          className="relative z-10 mx-auto w-full max-w-[34rem] lg:max-w-[38rem]"
        >
          <Image
            src="/cta.png"
            alt=""
            width={1672}
            height={941}
            sizes="(max-width: 1024px) 88vw, 36vw"
            className="h-auto w-full object-contain ltr:-scale-x-100"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
