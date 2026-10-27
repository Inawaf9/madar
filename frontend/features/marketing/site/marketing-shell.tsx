import { useTranslations } from "next-intl";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { cn } from "@/lib/utils";

export function MarketingShell({
  children,
  mainClassName,
  footerFlush = false,
}: {
  children: React.ReactNode;
  mainClassName?: string;
  footerFlush?: boolean;
}) {
  const t = useTranslations("Common");
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:inset-s-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-3 focus:text-primary-foreground"
      >
        {t("skipToContent")}
      </a>
      <SiteHeader />
      <main
        id="main-content"
        className={cn("min-w-0", mainClassName)}
      >
        {children}
      </main>
      <SiteFooter flush={footerFlush} />
    </>
  );
}
