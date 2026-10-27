"use client";

import Image from "next/image";
import {
  BriefcaseBusiness,
  Check,
  Coffee,
  HeartPulse,
  House,
  ShoppingBasket,
  Trees,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { AboutCopy } from "./about-copy";

const viewport = { once: true, amount: 0.3 } as const;

export function OpportunityScene({ copy }: { copy: AboutCopy }) {
  const reduced = useReducedMotion();
  return (
    <motion.figure
      aria-label={copy.acceptedDetail}
      className="relative mx-auto grid aspect-square w-full max-w-md place-items-center"
      initial={reduced ? false : { y: 10 }}
      whileInView={{ y: 0 }}
      viewport={viewport}
      transition={{ duration: 0.65 }}
    >
      <motion.div
        className="relative size-[70%] overflow-hidden rounded-full bg-secondary shadow-stone"
        initial={reduced ? false : { scale: 0.96 }}
        whileInView={{ scale: 1 }}
        viewport={viewport}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <Image
          src="/images/about/madar-character.png"
          alt=""
          fill
          sizes="(max-width: 768px) 260px, 320px"
          className="object-cover"
        />
      </motion.div>
      <motion.div
        className="absolute end-0 top-[5%] max-w-[70%] -rotate-3 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-floating sm:p-5"
        initial={reduced ? false : { opacity: 0.65, y: -16, rotate: -6 }}
        whileInView={{ opacity: 1, y: 0, rotate: -3 }}
        viewport={viewport}
        transition={{ duration: 0.5, delay: reduced ? 0 : 0.2 }}
      >
        <p className="text-xs text-muted-foreground">✦ {copy.notice}</p>
        <strong className="mt-2 flex items-center gap-2 text-lg">
          {copy.accepted}
          <motion.span
            aria-hidden="true"
            className="grid size-5 place-items-center rounded-full bg-primary text-primary-foreground"
            initial={reduced ? false : { scale: 0.65, opacity: 0.5 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={viewport}
            transition={{ duration: 0.35, delay: reduced ? 0 : 0.45 }}
          >
            <Check className="size-3" />
          </motion.span>
        </strong>
        <p className="text-sm text-primary">{copy.acceptedDetail}</p>
      </motion.div>
      <motion.div
        className="absolute bottom-[8%] start-0 max-w-[72%] rounded-2xl bg-primary px-4 py-3 text-sm text-primary-foreground shadow-floating sm:text-base"
        initial={reduced ? false : { opacity: 0.65, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewport}
        transition={{ duration: 0.45, delay: reduced ? 0 : 0.65 }}
      >
        {copy.whereStart}
      </motion.div>
    </motion.figure>
  );
}

export function DecisionScene({ copy }: { copy: AboutCopy }) {
  const reduced = useReducedMotion();
  return (
    <motion.figure
      aria-label={copy.mapAlt}
      className="relative mx-auto aspect-square w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-secondary shadow-floating"
      initial={reduced ? false : { opacity: 0.85, scale: 0.985 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={viewport}
      transition={{ duration: 0.65 }}
    >
      <svg
        viewBox="0 0 500 500"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        className="absolute inset-0 size-full"
      >
        <rect
          width="500"
          height="500"
          fill="var(--secondary)"
        />
        <path
          d="M0 80H500 M0 200H500 M0 335H500 M110 0V500 M275 0V500 M425 0V500"
          stroke="var(--card)"
          strokeWidth="24"
        />
        <path
          d="M365 165 C345 230 260 215 260 325 S205 390 160 410"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="12 10"
          opacity="0.28"
        />
        <motion.path
          d="M365 165 C345 230 260 215 260 325 S205 390 160 410"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="6"
          strokeLinecap="round"
          initial={reduced ? false : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={viewport}
          transition={{ duration: 1.25, delay: reduced ? 0 : 0.4, ease: "easeInOut" }}
        />
      </svg>
      <motion.span
        className="absolute end-[20%] top-[28%] grid size-11 place-items-center rounded-full bg-primary text-primary-foreground shadow-panel"
        initial={reduced ? false : { scale: 0.7, opacity: 0.6 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={viewport}
        transition={{ duration: 0.35, delay: reduced ? 0 : 0.15 }}
      >
        <BriefcaseBusiness
          aria-hidden="true"
          className="size-5"
        />
      </motion.span>
      <motion.span
        className="absolute bottom-[17%] start-[20%] grid size-11 place-items-center rounded-full bg-accent text-accent-foreground shadow-panel"
        initial={reduced ? false : { scale: 0.7, opacity: 0.6 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={viewport}
        transition={{ duration: 0.35, delay: reduced ? 0 : 0.32 }}
      >
        <House
          aria-hidden="true"
          className="size-5"
        />
      </motion.span>
      <motion.div
        className="absolute end-4 top-4 rounded-xl bg-card p-3 text-card-foreground shadow-floating sm:p-4"
        initial={reduced ? false : { opacity: 0.65, y: -10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewport}
        transition={{ duration: 0.45, delay: reduced ? 0 : 0.75 }}
      >
        <span className="block text-xs text-muted-foreground">{copy.firstHome}</span>
        <strong className="block text-sm">{copy.priceOkay}</strong>
        <span className="block text-xs text-accent-ink">{copy.farFromWork}</span>
      </motion.div>
      <motion.div
        className="absolute bottom-4 start-4 rounded-xl bg-card p-3 text-card-foreground shadow-floating sm:p-4"
        initial={reduced ? false : { opacity: 0.65, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewport}
        transition={{ duration: 0.45, delay: reduced ? 0 : 0.9 }}
      >
        <span className="block text-xs text-muted-foreground">{copy.dailyCommute}</span>
        <strong className="block text-sm">{copy.longerEveryDay}</strong>
      </motion.div>
    </motion.figure>
  );
}

export function NeighborhoodScene({ copy }: { copy: AboutCopy }) {
  const reduced = useReducedMotion();
  const services = [
    { icon: Coffee, label: copy.cafe, place: "end-[8%] top-[8%]" },
    { icon: HeartPulse, label: copy.hospital, place: "start-0 top-[32%]" },
    { icon: ShoppingBasket, label: copy.grocery, place: "end-0 bottom-[16%]" },
    { icon: Trees, label: copy.park, place: "start-[9%] bottom-[4%]" },
  ];
  return (
    <figure
      aria-label={copy.servicesAlt}
      className="relative mx-auto grid aspect-square w-full max-w-lg place-items-center overflow-hidden rounded-3xl bg-secondary/45"
    >
      <motion.div
        aria-hidden="true"
        className="absolute size-[78%] rounded-full border border-dashed border-primary/35"
        initial={reduced ? false : { scale: 0.72, opacity: 0.45 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={viewport}
        transition={{ duration: 0.85, delay: reduced ? 0 : 0.2 }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute size-[52%] rounded-full border border-primary/25"
        initial={reduced ? false : { scale: 0.8, opacity: 0.5 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={viewport}
        transition={{ duration: 0.65, delay: reduced ? 0 : 0.15 }}
      />
      <motion.span
        className="relative z-10 grid size-24 place-items-center rounded-3xl bg-primary text-primary-foreground shadow-stone sm:size-32"
        initial={reduced ? false : { scale: 0.9, opacity: 0.7 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={viewport}
        transition={{ duration: 0.45 }}
      >
        <House
          aria-hidden="true"
          className="size-12 sm:size-16"
        />
      </motion.span>
      {services.map(({ icon: Icon, label, place }, index) => (
        <motion.span
          key={label}
          className={`absolute z-10 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs text-card-foreground shadow-panel sm:px-4 sm:py-3 sm:text-sm ${place}`}
          initial={reduced ? false : { opacity: 0.65, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={viewport}
          transition={{ duration: 0.4, delay: reduced ? 0 : 0.38 + index * 0.12 }}
        >
          <Icon
            aria-hidden="true"
            className="size-4 text-accent-ink"
          />
          {label}
        </motion.span>
      ))}
    </figure>
  );
}
