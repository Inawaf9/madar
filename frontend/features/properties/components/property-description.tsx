"use client";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function PropertyDescription({ description }: { description: string | null }) {
  const t = useTranslations("PropertyDetail");
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const preview = useRef<HTMLParagraphElement>(null);
  const id = useId();
  useEffect(() => {
    const element = preview.current;
    if (!element) return;
    // Measure the rendered four-line preview, including after fonts/layout settle.
    let active = true;
    const measure = () => {
      if (active) setOverflows(element.scrollHeight > element.clientHeight + 1);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    void document.fonts.ready.then(measure);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, []);
  const open = expanded && overflows;
  return (
    <div className="min-h-0 min-w-0">
      <h2 className="mb-2 text-sm font-semibold">{t("about")}</h2>
      <div
        id={id}
        className={cn(
          "relative min-h-0 min-w-0",
          overflows && "h-44 max-h-44 sm:h-52 sm:max-h-52",
        )}
      >
        <p
          ref={preview}
          aria-hidden={open || undefined}
          dir="auto"
          className={cn(
            "line-clamp-4 whitespace-pre-line text-start text-sm leading-7 [overflow-wrap:anywhere]",
            open && "invisible absolute inset-x-0 top-0 pointer-events-none",
          )}
        >
          {description || t("noDescription")}
        </p>
        {open ? (
          <ScrollArea
            className="h-full max-h-full rounded-lg"
            role="region"
            aria-label={t("fullDescription")}
          >
            <p
              dir="auto"
              className="whitespace-pre-line break-words pe-3 text-start text-sm leading-7 [overflow-wrap:anywhere]"
            >
              {description}
            </p>
          </ScrollArea>
        ) : null}
      </div>
      {overflows ? (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="mt-1 px-0"
          aria-controls={id}
          aria-expanded={open}
          onClick={() => setExpanded((v) => !v)}
        >
          {t(open ? "showLess" : "readMore")}
        </Button>
      ) : null}
    </div>
  );
}
