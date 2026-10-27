"use client";

import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { DisplayHeading } from "@/components/typography/display-heading";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
  align?: "start" | "center";
  tone?: "default" | "inverse" | "secondary";
  editorial?: boolean;
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "start",
  tone = "default",
  editorial = false,
  className,
}: SectionHeadingProps) {
  const locale = useLocale();
  const inverse = tone === "inverse";
  const textColor = inverse
    ? "text-comparison-foreground"
    : tone === "secondary"
      ? "text-secondary-foreground"
      : "text-foreground";
  const mutedColor = inverse ? "text-comparison-foreground/85" : "text-muted-foreground";

  return (
    <div
      className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}
    >
      {eyebrow ? (
        <p
          className={cn(
            "text-xs font-bold",
            locale === "en" && "tracking-[.12em]",
            inverse ? "text-comparison-foreground/85" : "text-accent-ink",
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <DisplayHeading
        as="h2"
        variant="editorial"
        className={cn(
          eyebrow && "mt-3",
          !editorial && "font-heading font-medium",
          textColor,
        )}
      >
        {title}
      </DisplayHeading>
      <p
        className={cn(
          "mt-4 max-w-2xl text-sm leading-7 sm:text-base sm:leading-8",
          mutedColor,
        )}
      >
        {description}
      </p>
    </div>
  );
}
