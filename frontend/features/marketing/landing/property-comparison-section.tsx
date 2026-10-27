"use client";

import { useState } from "react";
import {
  ArrowDownUp,
  ArrowLeftRight,
  BedDouble,
  BriefcaseBusiness,
  Check,
  GraduationCap,
  MapPin,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "./section-heading";

const homes = [
  {
    name: "propertyOne",
    image: "/compare-1.png",
    imageAlt: "imageAltOne",
    area: "malqa",
    beds: "3",
    rent: "7,200",
    work: "22",
    school: "12",
    fit: "strong",
    tags: ["quiet", "central"],
  },
  {
    name: "propertyTwo",
    image: "/compare-2.png",
    imageAlt: "imageAltTwo",
    area: "narjis",
    beds: "4",
    rent: "8,000",
    work: "18",
    school: "16",
    fit: "balanced",
    tags: ["quiet", "spacious"],
  },
  {
    name: "propertyThree",
    image: "/compare-3.png",
    imageAlt: "imageAltThree",
    area: "yasmin",
    beds: "2",
    rent: "6,400",
    work: "28",
    school: "9",
    fit: "strong",
    tags: ["central", "spacious"],
  },
] as const;

export function PropertyComparisonSection() {
  const t = useTranslations("PropertyComparison");
  const common = useTranslations("Common");
  const minutes = t("minuteUnit");
  const [hoveredHome, setHoveredHome] = useState<number | null>(null);
  const [selectedHome, setSelectedHome] = useState<number | null>(null);
  const activeHome = hoveredHome ?? selectedHome;
  const reduceMotion = useReducedMotion();
  const labels = [t("neighborhood"), t("bedrooms"), t("commute"), t("school")];

  return (
    <section
      id="compare"
      className="scroll-mt-24 bg-comparison py-16 text-comparison-foreground sm:py-24 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            eyebrow={t("eyebrow")}
            title={t("title")}
            description={t("description")}
            tone="inverse"
            editorial
          />
          <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-comparison-foreground/25 px-3.5 py-2 text-xs text-comparison-foreground">
            <ArrowDownUp
              aria-hidden="true"
              className="size-3.5"
            />
            {common("illustrative")}
          </span>
        </div>

        <div className="relative mt-8">
          <p className="mb-2 flex items-center gap-2 text-xs text-comparison-foreground sm:hidden">
            <ArrowLeftRight
              aria-hidden="true"
              className="size-4 shrink-0"
            />
            <span>{t("scrollHint")}</span>
          </p>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.12 }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
            role="region"
            aria-label={t("scrollComparison")}
            tabIndex={0}
            className="overflow-x-auto rounded-3xl border border-border bg-card text-card-foreground shadow-stone focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            <table className="w-full min-w-[700px] table-fixed border-separate border-spacing-0">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="w-[19%] border-b border-e border-border bg-muted/55 p-3 text-start text-xs font-semibold sm:p-5"
                  >
                    {t("property")}
                  </th>
                  {homes.map((home, index) => (
                    <th
                      key={home.name}
                      scope="col"
                      onMouseEnter={() => setHoveredHome(index)}
                      onMouseLeave={() => setHoveredHome(null)}
                      className={`border-b border-e border-border p-2 text-start align-top last:border-e-0 sm:p-3 ${activeHome === index ? "bg-muted/70" : ""}`}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="lg"
                        aria-pressed={selectedHome === index}
                        onFocus={() => setHoveredHome(index)}
                        onBlur={() => setHoveredHome(null)}
                        onClick={() =>
                          setSelectedHome(selectedHome === index ? null : index)
                        }
                        className="group block h-auto w-full justify-start rounded-xl border border-border bg-background p-2 text-start font-normal whitespace-normal hover:bg-muted/45 focus-visible:ring-2 focus-visible:ring-ring sm:p-3"
                      >
                        <span className="relative mb-2 block aspect-[16/10] overflow-hidden rounded-lg bg-muted">
                          <Image
                            src={home.image}
                            alt={t(home.imageAlt)}
                            fill
                            sizes="(max-width: 767px) 175px, (max-width: 1280px) 26vw, 23vw"
                            className={`object-cover ${reduceMotion ? "" : "transition-transform duration-500 group-hover:scale-105"}`}
                          />
                        </span>
                        <span className="block text-xs font-semibold leading-5 sm:text-sm">
                          {t(home.name)}
                        </span>
                        <span className="mt-2 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                          <span className="text-xs text-muted-foreground">
                            {t("monthly")}
                          </span>
                          <span className="text-base font-bold text-primary sm:text-lg">
                            {home.rent}{" "}
                            <span className="text-xs font-normal text-muted-foreground">
                              {common("currency")}
                            </span>
                          </span>
                        </span>
                      </Button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {labels.map((label, row) => (
                  <tr key={label}>
                    <th
                      scope="row"
                      className="border-b border-e border-border bg-muted/55 p-3 text-start text-xs font-medium sm:p-5"
                    >
                      <span className="flex items-center gap-2">
                        <span className="hidden sm:inline">
                          <RowIcon row={row} />
                        </span>
                        {label}
                      </span>
                    </th>
                    {homes.map((home, index) => (
                      <td
                        key={`${label}-${home.name}`}
                        className={`border-b border-e border-border p-3 text-sm last:border-e-0 sm:p-5 ${activeHome === index ? "bg-muted/70" : ""}`}
                      >
                        {
                          [
                            t(home.area),
                            home.beds,
                            `${home.work} ${minutes}`,
                            `${home.school} ${minutes}`,
                          ][row]
                        }
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <th
                    scope="row"
                    className="border-e border-border bg-muted/55 p-3 text-start text-xs font-semibold sm:p-5"
                  >
                    {t("suitability")}
                  </th>
                  {homes.map((home, index) => (
                    <td
                      key={`${home.name}-fit`}
                      className={`border-e border-border p-3 last:border-e-0 sm:p-5 ${activeHome === index ? "bg-muted/70" : ""}`}
                    >
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1.5 text-xs font-semibold text-foreground">
                        <Check
                          aria-hidden="true"
                          className="size-3"
                        />
                        {t(home.fit)}
                      </span>
                      <span className="mt-2 flex flex-wrap gap-1">
                        {home.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-muted px-2 py-1 text-xs text-foreground"
                          >
                            {t(tag)}
                          </span>
                        ))}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </motion.div>
        </div>
        <p className="mt-4 text-xs leading-6 text-comparison-foreground">
          {t("mockNote")}
        </p>
      </div>
    </section>
  );
}

function RowIcon({ row }: { row: number }) {
  const Icon = [MapPin, BedDouble, BriefcaseBusiness, GraduationCap][row];
  return (
    <Icon
      aria-hidden="true"
      className="size-3.5 text-primary"
    />
  );
}
