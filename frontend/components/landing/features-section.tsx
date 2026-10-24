"use client";

import { Compass, ExternalLink, HeartHandshake, MapPin, Scale, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { SectionHeading } from "./section-heading";
import { motion, useReducedMotion } from "motion/react";

const features = [
  ["flexibleTitle", "flexibleDescription", Compass],
  ["externalTitle", "externalDescription", ExternalLink],
  ["lifestyleTitle", "lifestyleDescription", HeartHandshake],
  ["locationsTitle", "locationsDescription", MapPin],
  ["compareTitle", "compareDescription", Scale],
  ["insightsTitle", "insightsDescription", Sparkles],
] as const;

export function FeaturesSection() {
  const t = useTranslations("Features");
  const locale = useLocale();
  const reduceMotion = useReducedMotion();
  const direction = locale === "ar" ? -1 : 1;
  const [primaryFeature, externalFeature, ...supportingFeatures] = features;
  const [primaryTitle, primaryDescription, PrimaryIcon] = primaryFeature;
  const [externalTitle, externalDescription, ExternalIcon] = externalFeature;

  return (
    <section className="bg-card py-14 sm:py-18 lg:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
          <p className="inline-flex items-center gap-2 pb-1 text-xs text-muted-foreground"><span className="size-1.5 rounded-full bg-accent" />{t("demoNote")}</p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-12">
          <motion.article initial={reduceMotion ? false : { opacity: 0, x: -18 * direction }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="relative flex min-h-56 flex-col justify-between overflow-hidden rounded-2xl bg-comparison p-6 text-comparison-foreground sm:p-8 lg:col-span-5">
            <div className="flex items-start justify-between gap-4"><span className="grid size-11 place-items-center rounded-xl bg-comparison-foreground/10"><PrimaryIcon aria-hidden="true" className="size-5" /></span><span className="text-xs font-semibold text-comparison-foreground/75">01</span></div>
            <div className="mt-8"><h3 className="text-xl font-semibold">{t(primaryTitle)}</h3><p className="mt-2 max-w-sm text-sm leading-6 text-comparison-foreground/90">{t(primaryDescription)}</p></div>
          </motion.article>
          <motion.article initial={reduceMotion ? false : { opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5, delay: 0.08 }} className="flex min-h-56 flex-col justify-between rounded-2xl border border-border bg-background p-6 sm:p-8 lg:col-span-7">
            <div className="flex items-start justify-between gap-4"><span className="grid size-11 place-items-center rounded-xl bg-accent/15 text-foreground"><ExternalIcon aria-hidden="true" className="size-5" /></span><span className="text-xs font-semibold text-muted-foreground">02</span></div>
            <div className="mt-8"><h3 className="text-xl font-semibold">{t(externalTitle)}</h3><p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">{t(externalDescription)}</p></div>
          </motion.article>
        </div>

        <div className="mt-7 grid gap-x-8 sm:grid-cols-2 lg:gap-x-12">
          {supportingFeatures.map(([title, description, Icon], index) => <motion.article key={title} initial={reduceMotion ? false : { opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.4, delay: index * 0.05 }} className="flex gap-3 border-t border-border py-4 sm:py-5">
            <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-primary"><Icon aria-hidden="true" className="size-4" /></span>
            <div><h3 className="text-sm font-semibold">{t(title)}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{t(description)}</p></div>
          </motion.article>)}
        </div>
      </div>
    </section>
  );
}
