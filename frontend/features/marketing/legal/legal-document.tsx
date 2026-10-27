import { ArrowUpLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Separator } from "@/components/ui/separator";

type LegalCopy = {
  label: string;
  title: string;
  intro: string;
  updated: string;
  sections: readonly { title: string; paragraphs: readonly string[] }[];
};

export function LegalDocument({
  copy,
  relatedHref,
  relatedLabel,
  backLabel,
  contentsLabel,
}: {
  copy: LegalCopy;
  relatedHref: "/privacy" | "/terms";
  relatedLabel: string;
  backLabel: string;
  contentsLabel: string;
}) {
  return (
    <article className="mx-auto max-w-7xl px-5 pb-20 pt-12 sm:px-8 sm:pt-18 lg:px-12 lg:pb-28">
      <header className="max-w-4xl pb-12 sm:pb-16">
        <p className="inline-flex rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-accent-ink">
          {copy.label}
        </p>
        <h1 className="mt-6 max-w-3xl text-balance font-display text-hero font-bold">
          {copy.title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg sm:leading-9">
          {copy.intro}
        </p>
        <p className="mt-5 text-xs text-muted-foreground sm:text-sm">{copy.updated}</p>
      </header>
      <Separator />
      <div className="grid gap-12 pt-10 lg:grid-cols-[minmax(0,220px)_minmax(0,720px)] lg:gap-16 lg:pt-14">
        <nav
          aria-label={contentsLabel}
          className="min-w-0 lg:sticky lg:top-32 lg:self-start"
        >
          <p className="mb-3 text-xs font-semibold text-foreground">{contentsLabel}</p>
          <ol className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3 lg:grid-cols-1">
            {copy.sections.map((section, index) => (
              <li key={index}>
                <a
                  href={`#section-${index + 1}`}
                  className="block rounded-md py-1.5 text-xs leading-6 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-ring sm:text-sm"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="min-w-0">
          {copy.sections.map((section, index) => (
            <section
              id={`section-${index + 1}`}
              key={index}
              className="scroll-mt-32 border-b border-border/70 py-8 first:pt-0 last:border-0 sm:py-10"
            >
              <h2 className="text-balance font-heading text-xl font-semibold leading-8 sm:text-2xl">
                {section.title}
              </h2>
              <div className="mt-4 flex flex-col gap-4">
                {section.paragraphs.map((paragraph, paragraphIndex) => (
                  <p
                    key={paragraphIndex}
                    className="max-w-[70ch] text-sm leading-8 text-muted-foreground sm:text-base sm:leading-9"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
      <Separator className="mt-10" />
      <nav
        aria-label={contentsLabel}
        className="flex flex-wrap gap-x-8 gap-y-2 pt-5 text-sm"
      >
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 rounded-md text-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
        >
          <ArrowUpLeft
            aria-hidden="true"
            className="size-4 rtl:-scale-x-100"
          />
          {backLabel}
        </Link>
        <Link
          href={relatedHref}
          className="inline-flex min-h-11 items-center rounded-md text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
        >
          {relatedLabel}
        </Link>
      </nav>
    </article>
  );
}
