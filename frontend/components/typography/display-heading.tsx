import type { ComponentPropsWithoutRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const displayHeadingVariants = cva("min-w-0 text-balance font-heading font-medium", {
  variants: {
    variant: {
      page: "text-page",
      section: "text-section",
      editorial: "font-display text-editorial font-bold",
      hero: "font-display text-hero font-bold",
    },
  },
  defaultVariants: { variant: "page" },
});

export function DisplayHeading({ as: Tag = "h1", variant, className, ...props }: ComponentPropsWithoutRef<"h1"> & VariantProps<typeof displayHeadingVariants> & { as?: "h1" | "h2" | "h3" }) {
  return <Tag className={cn(displayHeadingVariants({ variant }), className)} {...props} />;
}

// Only approved static display copy can opt in. Never elongate API/user text.
const curatedArabicCopy: Readonly<Record<string, string>> = {
  "بيتك المناسب،": "بيتـك المناسب،",
};
export function CuratedDisplayText({ text, enabled = false }: { text: string; enabled?: boolean }) {
  const display = enabled ? curatedArabicCopy[text] : undefined;
  return display ? <><span className="sr-only">{text}</span><span aria-hidden="true">{display}</span></> : <>{text}</>;
}
