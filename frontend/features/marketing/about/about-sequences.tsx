"use client";

import Image from "next/image";
import { ArrowDown, ArrowUpLeft } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import type { AboutCopy } from "./about-copy";

const viewport = { once: true, amount: 0.35 } as const;
const character = "/images/about/madar-character.png";

export function HeroSequence({ copy }: { copy: AboutCopy }) {
  const reduced = useReducedMotion();
  const enter = (delay: number, y = 12) => ({
    initial: reduced ? (false as const) : { opacity: 0.8, y },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, delay: reduced ? 0 : delay },
  });

  return (
    <section className="relative overflow-hidden bg-brand-photo text-brand-photo-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -end-32 -top-48 size-[min(100vw,650px)] rounded-full border border-white/10"
      />
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 pb-16 pt-16 sm:px-8 sm:pt-20 lg:grid-cols-2 lg:gap-14 lg:px-12 lg:pb-24 lg:pt-24">
        <div>
          <motion.p
            {...enter(0.05, 8)}
            className="flex items-center gap-3 text-sm text-brand-photo-foreground/75"
          >
            <span
              aria-hidden="true"
              className="h-px w-8 bg-accent"
            />
            {copy.eyebrow}
          </motion.p>
          <h1 className="mt-5 font-display text-[clamp(3rem,7vw,6.5rem)] font-bold leading-[1.2]">
            {copy.title.split("\n").map((line, index) => (
              <motion.span
                key={index}
                {...enter(0.18 + index * 0.15, 16)}
                className="block"
              >
                {line}
              </motion.span>
            ))}
          </h1>
          <motion.p
            {...enter(0.52)}
            className="mt-6 max-w-xl text-base leading-8 text-brand-photo-foreground/85 sm:text-xl sm:leading-10"
          >
            {copy.intro}
          </motion.p>
          <motion.a
            {...enter(0.68, 6)}
            href="#start"
            className="mt-8 inline-flex min-h-11 items-center gap-3 rounded-md border-b border-brand-photo-foreground/45 py-2 text-sm text-brand-photo-foreground underline-offset-4 transition-colors hover:border-brand-photo-foreground hover:underline focus-visible:outline-2 focus-visible:outline-ring sm:text-base"
          >
            <motion.span
              aria-hidden="true"
              animate={reduced ? undefined : { y: [0, 3, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowDown className="size-5" />
            </motion.span>
            {copy.scroll}
          </motion.a>
        </div>
        <div className="relative mx-auto grid aspect-square w-full max-w-lg place-items-center">
          <motion.div
            aria-hidden="true"
            className="absolute size-[96%] rounded-full border border-brand-photo-foreground/15"
            animate={reduced ? undefined : { rotate: 360 }}
            transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            aria-hidden="true"
            className="absolute size-[76%] rounded-full border border-dashed border-brand-photo-foreground/25"
            animate={reduced ? undefined : { rotate: -360 }}
            transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            initial={reduced ? false : { scale: 0.94, opacity: 0.75 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: reduced ? 0 : 0.35 }}
            className="relative size-[67%]"
          >
            <motion.div
              animate={reduced ? undefined : { y: [0, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative size-full overflow-hidden rounded-full bg-secondary shadow-floating"
            >
              <Image
                src={character}
                alt={copy.portrait}
                fill
                priority
                sizes="(max-width: 1024px) 60vw, 340px"
                className="object-cover"
              />
            </motion.div>
          </motion.div>
          <motion.div
            initial={reduced ? false : { opacity: 0.7, y: -10, rotate: 1 }}
            animate={{ opacity: 1, y: 0, rotate: 3 }}
            whileHover={
              reduced ? undefined : { y: -4, transition: { duration: 0.25, delay: 0 } }
            }
            transition={{ duration: 0.5, delay: reduced ? 0 : 0.75 }}
            className="absolute end-0 top-[9%] max-w-[52%] rotate-3 rounded-xl bg-card px-3 py-2 text-card-foreground shadow-floating sm:px-5 sm:py-3"
          >
            <small className="block text-xs text-muted-foreground">{copy.inbox} ✦</small>
            <span className="text-xs font-medium sm:text-sm">{copy.offer}</span>
          </motion.div>
          <motion.div
            initial={reduced ? false : { opacity: 0.7, y: 10, rotate: -1 }}
            animate={{ opacity: 1, y: 0, rotate: -3 }}
            whileHover={
              reduced ? undefined : { y: -4, transition: { duration: 0.25, delay: 0 } }
            }
            transition={{ duration: 0.5, delay: reduced ? 0 : 0.95 }}
            className="absolute bottom-[8%] start-0 max-w-[52%] -rotate-3 rounded-xl bg-card px-3 py-2 text-card-foreground shadow-floating sm:px-5 sm:py-3"
          >
            <small className="block text-xs text-muted-foreground">{copy.question}</small>
            <span className="text-xs font-medium sm:text-sm">{copy.where}</span>
          </motion.div>
        </div>
      </div>
      <motion.div
        {...enter(1.1, 4)}
        className="mx-auto max-w-7xl px-5 pb-6 text-xs text-brand-photo-foreground/65 sm:px-8 lg:px-12"
      >
        {copy.foot}
      </motion.div>
    </section>
  );
}

export function ChapterNarration({
  chapter,
  dark = false,
}: {
  chapter: AboutCopy["chapters"][number];
  dark?: boolean;
}) {
  const reduced = useReducedMotion();
  const reveal = (delay: number) => ({
    initial: reduced ? (false as const) : { opacity: 0.78, y: 12 },
    whileInView: { opacity: 1, y: 0 },
    viewport,
    transition: { duration: 0.5, delay: reduced ? 0 : delay },
  });
  return (
    <div>
      <motion.p
        {...reveal(0)}
        className={
          dark ? "text-sm text-brand-photo-foreground/75" : "text-sm text-accent-ink"
        }
      >
        {chapter.number}
      </motion.p>
      <h2 className="mt-4 font-display text-editorial font-bold leading-tight sm:text-[clamp(2.5rem,4.5vw,4.5rem)]">
        {chapter.title.split("\n").map((line, index) => (
          <motion.span
            key={index}
            {...reveal(0.1 + index * 0.12)}
            className="block"
          >
            {line}
          </motion.span>
        ))}
      </h2>
      <motion.p
        {...reveal(0.3)}
        className={
          dark
            ? "mt-6 max-w-xl text-base leading-8 text-brand-photo-foreground/85 sm:text-lg sm:leading-9"
            : "mt-6 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg sm:leading-9"
        }
      >
        {chapter.body}
      </motion.p>
      <motion.p
        {...reveal(0.46)}
        className={
          dark
            ? "mt-5 text-xl font-semibold text-brand-photo-foreground"
            : "mt-5 text-xl font-semibold text-primary"
        }
      >
        {chapter.quote}
      </motion.p>
    </div>
  );
}

export function TurningSequence({ copy }: { copy: AboutCopy }) {
  const reduced = useReducedMotion();
  const reveal = (delay: number) => ({
    initial: reduced ? (false as const) : { opacity: 0.75, y: 12 },
    whileInView: { opacity: 1, y: 0 },
    viewport,
    transition: { duration: 0.6, delay: reduced ? 0 : delay },
  });
  return (
    <section className="relative overflow-hidden bg-secondary px-5 py-20 text-center sm:px-8 sm:py-28">
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-primary/[0.04]"
        initial={reduced ? false : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={viewport}
        transition={{ duration: 1.1 }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute start-[8%] top-1/2 hidden h-px w-[12%] bg-primary/30 lg:block"
        initial={reduced ? false : { x: -24, opacity: 0.25 }}
        whileInView={{ x: 0, opacity: 1 }}
        viewport={viewport}
        transition={{ duration: 0.8, delay: reduced ? 0 : 0.3 }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute end-[8%] top-1/2 hidden h-px w-[12%] bg-primary/30 lg:block"
        initial={reduced ? false : { x: 24, opacity: 0.25 }}
        whileInView={{ x: 0, opacity: 1 }}
        viewport={viewport}
        transition={{ duration: 0.8, delay: reduced ? 0 : 0.3 }}
      />
      <div className="relative mx-auto max-w-5xl">
        <motion.p
          {...reveal(0)}
          className="text-sm text-accent-ink"
        >
          {copy.turningLabel}
        </motion.p>
        <h2 className="mt-5 font-display text-editorial font-bold leading-[1.55]">
          {copy.turningQuestion.split("\n").map((line, index) => (
            <motion.span
              key={index}
              {...reveal(0.15 + index * 0.22)}
              className={index === 1 ? "block text-primary" : "block"}
            >
              {line}
            </motion.span>
          ))}
        </h2>
        <motion.p
          {...reveal(0.55)}
          className="mx-auto mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg sm:leading-9"
        >
          {copy.turningBody}
        </motion.p>
      </div>
    </section>
  );
}

export function ClosingSequence({ copy }: { copy: AboutCopy }) {
  const reduced = useReducedMotion();
  const reveal = (delay: number, y = 12) => ({
    initial: reduced ? (false as const) : { opacity: 0.78, y },
    whileInView: { opacity: 1, y: 0 },
    viewport,
    transition: { duration: 0.55, delay: reduced ? 0 : delay },
  });
  return (
    <section className="relative overflow-hidden bg-brand-photo px-5 py-20 text-center text-brand-photo-foreground sm:px-8 sm:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 m-auto size-[min(95vw,620px)] rounded-full border border-white/10"
      />
      <div className="relative mx-auto max-w-3xl">
        <motion.div
          initial={reduced ? false : { scale: 0.93, opacity: 0.75 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={viewport}
          transition={{ duration: 0.65 }}
          className="relative mx-auto size-32 overflow-hidden rounded-full border-4 border-secondary bg-secondary"
        >
          <Image
            src={character}
            alt=""
            fill
            sizes="128px"
            className="object-cover"
          />
        </motion.div>
        <motion.p
          {...reveal(0.15)}
          className="mt-6 text-sm text-brand-photo-foreground/75"
        >
          {copy.endingLabel}
        </motion.p>
        <motion.h2
          {...reveal(0.28)}
          className="mt-4 font-display text-editorial font-bold"
        >
          {copy.endingTitle}
        </motion.h2>
        <motion.p
          {...reveal(0.45)}
          className="mt-5 text-lg leading-9 text-brand-photo-foreground/85 sm:text-xl"
        >
          {copy.endingBody}
        </motion.p>
        <motion.p
          {...reveal(0.62, 5)}
          className="mx-auto mt-6 w-fit rounded-full border border-brand-photo-foreground/40 px-5 py-2 text-sm"
        >
          {copy.endingPill}
        </motion.p>
        <motion.div {...reveal(0.72, 5)}>
          <Link
            href="/properties"
            className={buttonVariants({
              variant: "secondary",
              size: "lg",
              className: "mt-8",
            })}
          >
            {copy.explore}
            <ArrowUpLeft
              aria-hidden="true"
              data-icon="inline-end"
              className="rtl:-scale-x-100"
            />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
