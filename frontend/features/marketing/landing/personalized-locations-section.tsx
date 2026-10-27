"use client";

import { BriefcaseBusiness, Heart, MapPin, School, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { SectionHeading } from "./section-heading";

export function PersonalizedLocationsSection() {
  const t = useTranslations("PersonalizedLocations");
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="personalize"
      className="scroll-mt-24 overflow-hidden bg-muted/35 py-14 sm:py-18 lg:py-20"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-14 lg:px-12">
        <div>
          <SectionHeading
            eyebrow={t("eyebrow")}
            title={t("title")}
            description={t("description")}
          />
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-accent/35 bg-card px-4 py-3.5">
            <Sparkles
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-accent"
            />
            <p className="text-sm leading-6 text-foreground">{t("optionalNote")}</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <LocationChip
              icon={BriefcaseBusiness}
              label={t("workplace")}
            />
            <LocationChip
              icon={BriefcaseBusiness}
              label={t("familyWorkplace")}
            />
            <LocationChip
              icon={School}
              label={t("school")}
            />
            <LocationChip
              icon={Heart}
              label={t("favorite")}
            />
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-none">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-3 shadow-stone sm:p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold">{t("locationTitle")}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("locationSubtitle")}
                </p>
              </div>
              <span className="grid size-10 place-items-center rounded-full bg-secondary text-primary">
                <MapPin
                  aria-hidden="true"
                  className="size-5"
                />
              </span>
            </div>
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 0.65, ease: [0.22, 1, 0.36, 1] }
              }
              className="relative mt-3 aspect-[4/3] overflow-hidden rounded-xl bg-background"
            >
              <Image
                src="/intrest-places.png"
                alt={t("mapImageAlt")}
                width={1448}
                height={1086}
                sizes="(max-width: 640px) 90vw, (max-width: 1024px) 56vw, 40vw"
                className="size-full object-contain"
              />
              <span className="absolute bottom-3 start-3 rounded-full border border-border bg-card/95 px-3 py-1.5 text-xs font-medium shadow-sm">
                {t("mapLabel")}
              </span>
            </motion.div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/70 p-3">
                <p className="text-xs text-muted-foreground">{t("workplace")}</p>
                <p className="mt-1 text-sm font-semibold">{t("minutesToWork")}</p>
              </div>
              <div className="rounded-lg bg-muted/70 p-3">
                <p className="text-xs text-muted-foreground">{t("school")}</p>
                <p className="mt-1 text-sm font-semibold">{t("nearSchool")}</p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              {t("sampleOnly")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function LocationChip({ icon: Icon, label }: { icon: typeof MapPin; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2.5 text-xs font-medium">
      <Icon
        aria-hidden="true"
        className="size-3.5 text-primary"
      />
      {label}
    </span>
  );
}
