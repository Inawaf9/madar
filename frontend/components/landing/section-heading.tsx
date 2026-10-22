"use client";

import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
  align?: "start" | "center";
  tone?: "default" | "inverse" | "secondary";
  editorial?: boolean;
  className?: string;
};

export function SectionHeading({ eyebrow, title, description, align = "start", tone = "default", editorial = false, className }: SectionHeadingProps) {
  const locale = useLocale();
  const inverse = tone === "inverse";
  const textColor = inverse ? "text-comparison-foreground" : tone === "secondary" ? "text-secondary-foreground" : "text-foreground";
  const mutedColor = inverse ? "text-comparison-foreground/85" : "text-muted-foreground";

  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? <p className={cn("text-xs font-bold", locale === "en" && "tracking-[.12em]", inverse ? "text-comparison-foreground/85" : "text-accent-ink")}>{eyebrow}</p> : null}
      <h2 className={cn("text-[clamp(1.75rem,3.25vw,2.75rem)] leading-[1.4] text-balance", eyebrow && "mt-3", editorial ? "font-display font-bold" : "font-heading font-medium", textColor)}>{title}</h2>
      <p className={cn("mt-4 max-w-2xl text-sm leading-7 sm:text-base sm:leading-8", mutedColor)}>{description}</p>
    </div>
  );
}
