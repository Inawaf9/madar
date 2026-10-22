"use client";

import { useRef } from "react";
import { Compass, MapPinned, Scale } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { SectionHeading } from "./section-heading";

const steps = [
  { title: "stepOneTitle", description: "stepOneDescription", icon: Compass },
  { title: "stepTwoTitle", description: "stepTwoDescription", icon: MapPinned },
  { title: "stepThreeTitle", description: "stepThreeDescription", icon: Scale },
] as const;

export function HowItWorksSection() {
  const t = useTranslations("HowItWorks");
  const locale = useLocale();
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start 0.82", "end 0.55"] });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 90, damping: 26, restDelta: 0.001 });
  const scaleX = useTransform(smoothProgress, [0, 1], [0, 1]);
  return (
    <section ref={sectionRef} id="how-it-works" className="scroll-mt-24 bg-background py-14 sm:py-18 lg:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
        <div className="relative mt-10 md:mt-12">
          <div className="absolute start-[12%] end-[12%] top-6 hidden h-px bg-border md:block" aria-hidden="true"><motion.div style={reduceMotion ? undefined : { scaleX, transformOrigin: locale === "ar" ? "right" : "left" }} className="h-full w-full bg-accent" /></div>
          <ol className="relative grid gap-0 before:absolute before:bottom-10 before:start-[1.45rem] before:top-5 before:border-s before:border-dashed before:border-border before:content-[''] md:grid-cols-3 md:gap-8 md:before:hidden">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return <motion.li key={step.title} initial={reduceMotion ? false : { opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.45, delay: index * 0.08 }} className="relative grid grid-cols-[3rem_1fr] gap-4 border-b border-border py-5 last:border-b-0 md:block md:border-0 md:py-0">
                <span className="relative z-10 grid size-12 place-items-center rounded-full border border-border bg-card text-primary shadow-sm md:mb-5"><Icon aria-hidden="true" className="size-5" /></span>
                <div className="pb-1 md:border-s md:border-border md:ps-5">
                  <p className="text-xs font-semibold tracking-[0.12em] text-accent-ink">0{index + 1}</p>
                  <h3 className="mt-2 text-lg font-semibold leading-snug">{t(step.title)}</h3>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground sm:leading-7">{t(step.description)}</p>
                </div>
              </motion.li>;
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
