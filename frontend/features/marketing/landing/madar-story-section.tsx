"use client";

import Image from "next/image";
import {
  ArrowUpLeft,
  BriefcaseBusiness,
  Heart,
  House,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "motion/react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { displayHeadingVariants } from "@/components/typography/display-heading";
import { cn } from "@/lib/utils";

const markerDrifts = {
  home: {
    x: [0, 4, 6, 2, 0],
    y: [0, -4, -1, 3, 0],
    duration: 11,
    delay: 0,
  },
  work: {
    x: [0, -3, -6, -2, 0],
    y: [0, 3, 0, -4, 0],
    duration: 12.5,
    delay: 0.8,
  },
  interests: {
    x: [0, 3, -2, -5, 0],
    y: [0, -2, -5, 1, 0],
    duration: 10.5,
    delay: 1.6,
  },
};

type MarkerDrift = {
  x: number[];
  y: number[];
  duration: number;
  delay: number;
};

type StoryContextMarkerProps = {
  icon: LucideIcon;
  label: string;
  className: string;
  drift: MarkerDrift;
  reducedMotion: boolean;
};

export function MadarStorySection() {
  const t = useTranslations("Hero");
  const reducedMotion = Boolean(useReducedMotion());

  return (
    <section
      id="story"
      className={cn(
        "relative isolate scroll-mt-24 overflow-hidden",
        "py-12 sm:py-16 lg:py-18",
        "bg-[#1C2D47] text-white",
        "dark:bg-[#F1F4F8] dark:text-[#1C2D47]",
        "transition-colors duration-300",
      )}
    >
      {/* Ambient background effects */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className={cn(
            "absolute -top-40 start-1/2 size-[35rem]",
            "-translate-x-1/2 rounded-full blur-3xl",
            "bg-white/5",
            "dark:bg-[#405A80]/5",
          )}
        />

        <div
          className={cn(
            "absolute -bottom-60 start-0 size-[30rem]",
            "rounded-full blur-3xl",
            "bg-[#7396C2]/10",
            "dark:bg-[#405A80]/5",
          )}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        {/* Story heading */}
        <div className="mx-auto max-w-3xl text-center">
          <p
            className={cn(
              "text-sm font-medium",
              "text-[#C8D7EC]",
              "dark:text-[#526B8E]",
            )}
          >
            {t("storyEyebrow")}
          </p>

          <h1
            className={cn(
              displayHeadingVariants({
                variant: "hero",
              }),
              "mt-3",
              "text-white",
              "dark:text-[#1C2D47]",
            )}
          >
            {t("storyTitle")}
          </h1>

          <p
            className={cn(
              "mx-auto mt-4 max-w-2xl",
              "text-base leading-8",
              "text-white/75",
              "dark:text-[#526176]",
            )}
          >
            {t("storyDescription")}
          </p>
        </div>

        {/* Avatar composition */}
        <div
          className={cn(
            "relative mx-auto mt-6 flex max-w-3xl",
            "h-64 items-center justify-center",
            "sm:mt-8 sm:h-96",
            "lg:h-[27rem]",
          )}
        >
          {/* Ambient glow behind avatar */}
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute",
              "bottom-[12%] size-56 rounded-full",
              "bg-[#7396C2]/10 blur-3xl",
              "dark:bg-[#405A80]/10",
              "sm:size-72 lg:size-96",
            )}
          />

          {/* Ground shadow */}
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute bottom-4",
              "h-12 w-3/5 rounded-full",
              "bg-black/30 blur-2xl",
              "dark:bg-[#1C2D47]/15",
            )}
          />

          {/* Madar character */}
          <Image
            src="/images/about/madar-character.png"
            alt={t("avatarAlt")}
            width={587}
            height={603}
            sizes="(min-width: 1024px) 368px, (min-width: 640px) 288px, 208px"
            preload
            className={cn(
              "relative z-10 h-auto w-52",
              "sm:w-72 lg:w-[23rem]",
              "drop-shadow-[0_18px_24px_rgba(0,0,0,0.25)]",
              "dark:drop-shadow-[0_18px_24px_rgba(28,45,71,0.15)]",
            )}
          />

          {/* Home marker */}
          <StoryContextMarker
            icon={House}
            label={t("contextHome")}
            className={cn(
              "start-0 top-[13%] -rotate-6",
              "sm:start-[10%]",
              "lg:start-[14%]",
            )}
            drift={markerDrifts.home}
            reducedMotion={reducedMotion}
          />

          {/* Work marker */}
          <StoryContextMarker
            icon={BriefcaseBusiness}
            label={t("contextWork")}
            className={cn(
              "end-0 top-[32%] rotate-6",
              "sm:end-[10%]",
              "lg:end-[14%]",
            )}
            drift={markerDrifts.work}
            reducedMotion={reducedMotion}
          />

          {/* Interests marker */}
          <StoryContextMarker
            icon={Heart}
            label={t("contextInterests")}
            className={cn(
              "start-0 top-[66%] -rotate-3",
              "sm:start-[12%]",
              "lg:start-[18%]",
            )}
            drift={markerDrifts.interests}
            reducedMotion={reducedMotion}
          />
        </div>

        {/* Story CTA */}
        <div className="mt-4 text-center sm:mt-5">
          <Button
            nativeButton={false}
            render={<Link href="/about" />}
            size="lg"
            className={cn(
              "group rounded-full px-7",
              "border border-white/20",
              "bg-white text-[#1C2D47]",
              "shadow-[0_8px_30px_rgba(0,0,0,0.15)]",
              "hover:-translate-y-0.5 hover:bg-[#EAF0F8]",
              "dark:border-[#1C2D47]/15",
              "dark:bg-[#1C2D47] dark:text-white",
              "dark:shadow-[0_8px_30px_rgba(28,45,71,0.12)]",
              "dark:hover:bg-[#304563]",
              "transition-all duration-300",
              "motion-reduce:transform-none",
            )}
          >
            {t("storyLink")}

            <ArrowUpLeft
              aria-hidden="true"
              data-icon="inline-end"
              className={cn(
                "rtl:-scale-x-100",
                "transition-transform duration-300",
                "group-hover:-translate-x-0.5",
                "motion-reduce:transform-none",
              )}
            />
          </Button>
        </div>
      </div>
    </section>
  );
}

function StoryContextMarker({
  icon: Icon,
  label,
  className,
  drift,
  reducedMotion,
}: StoryContextMarkerProps) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute z-20",
        className,
      )}
    >
      <motion.span
        initial={false}
        animate={
          reducedMotion
            ? { x: 0, y: 0 }
            : {
              x: drift.x,
              y: drift.y,
            }
        }
        transition={
          reducedMotion
            ? { duration: 0 }
            : {
              duration: drift.duration,
              delay: drift.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }
        }
        className={cn(
          "inline-flex items-center gap-1.5",
          "whitespace-nowrap rounded-full",
          "px-2 py-1 sm:px-3 sm:py-1.5",
          "text-[10px] font-medium sm:text-xs",
          "border border-white/20",
          "bg-white/95 text-[#1C2D47]",
          "shadow-[0_8px_24px_rgba(0,0,0,0.18)]",
          "backdrop-blur-sm",
          "dark:border-[#1C2D47]/15",
          "dark:bg-[#1C2D47]/95 dark:text-white",
          "dark:shadow-[0_8px_24px_rgba(28,45,71,0.12)]",
          "transition-colors duration-300",
        )}
      >
        <Icon
          aria-hidden="true"
          className={cn(
            "size-3.5",
            "text-[#405A80]",
            "dark:text-[#C8D7EC]",
          )}
        />

        {label}
      </motion.span>
    </span>
  );
}