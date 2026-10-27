import Image from "next/image";
import { useTranslations } from "next-intl";
import "./auth-presentation.css";

export function AuthFrame({
  title,
  description,
  children,
  compact = false,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <section
      className="mx-auto w-full max-w-5xl pb-[var(--assistant-content-clearance)] pt-7 sm:pt-10 lg:pt-12"
      aria-labelledby="auth-page-title"
    >
      <div className="grid overflow-hidden rounded-3xl bg-background sm:border sm:border-border/80 sm:bg-card sm:shadow-stone lg:grid-cols-[1.05fr_1fr]">
        <div className="min-w-0 px-1 py-3 sm:px-9 sm:py-10 lg:px-11">
          <div className="mx-auto w-full max-w-[420px]">
            <header className="mb-7">
              <h1
                id="auth-page-title"
                className="text-[clamp(1.85rem,3vw,2.5rem)] leading-[1.35] font-bold text-balance"
              >
                {title}
              </h1>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                {description}
              </p>
            </header>
            {children}
          </div>
        </div>
        <AuthBrandPanel compact={compact} />
      </div>
    </section>
  );
}

function AuthBrandPanel({ compact }: { compact: boolean }) {
  const t = useTranslations("AuthUI");
  return (
    <aside
      className={`relative hidden overflow-hidden bg-brand-photo text-brand-photo-foreground lg:block ${compact ? "min-h-[480px]" : "min-h-[560px]"}`}
      aria-label={t("brandHeading")}
    >
      <Image
        src="/hero.png"
        alt={t("brandImageAlt")}
        fill
        sizes="(min-width: 1024px) 480px, 1px"
        className="object-cover object-center"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"
      />
      <div className="absolute inset-x-0 bottom-0 p-9 lg:p-10">
        <p className="max-w-[14ch] text-[2.15rem] leading-[1.4] font-medium text-balance">
          {t("brandHeading")}
        </p>
        <p className="mt-4 max-w-[34ch] text-base leading-relaxed text-white/90">
          {t("brandDescription")}
        </p>
        <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/90">
          <li>{t("brandBudget")}</li>
          <li>{t("brandPlaces")}</li>
          <li>{t("brandCompare")}</li>
        </ul>
      </div>
    </aside>
  );
}
