import { getLocale, getTranslations } from "next-intl/server";
import { cacheLife } from "next/cache";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SiteBrand } from "./site-brand";
import { getLayoutCopy } from "@/messages/layout-copy";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

async function copyrightYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}
export async function SiteFooter({ flush = false }: { flush?: boolean }) {
  const [locale, t, nav, product, year] = await Promise.all([
    getLocale(),
    getTranslations("Footer"),
    getTranslations("Navigation"),
    getTranslations("Workspace"),
    copyrightYear(),
  ]);
  const copy = getLayoutCopy(locale);
  const groups = [
    {
      label: copy.footerExplore,
      links: [
        ["/properties", product("properties")],
        ["/saved", product("saved")],
        ["/compare", product("compare")],
      ],
    },
    {
      label: copy.footerPlatform,
      links: [
        ["/about", nav("about")],
        ["/#personalize", nav("personalize")],
        ["/#how-it-works", nav("howItWorks")],
        ["/dashboard", copy.dashboard],
      ],
    },
    {
      label: copy.footerAccount,
      links: [
        ["/register", copy.register],
        ["/login", nav("login")],
        ["/profile", product("profile")],
      ],
    },
  ];
  return (
    <footer className={cn("border-t border-border/70 bg-card", !flush && "mt-10")}>
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:gap-12">
          <div className="max-w-sm">
            <SiteBrand />
            <p className="mt-6 font-display text-2xl leading-relaxed">
              {copy.footerLine}
            </p>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {t("description")}
            </p>
          </div>
          {groups.map((group) => (
            <nav
              key={group.label}
              aria-label={group.label}
            >
              <h2 className="mb-4 text-sm font-semibold">{group.label}</h2>
              <ul className="flex flex-col gap-1">
                {group.links.map(([href, label]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="group inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      {label}
                      <ArrowUpRight
                        aria-hidden="true"
                        className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 rtl:-scale-x-100 motion-reduce:transition-none"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <Separator className="mt-10 sm:mt-12" />
        <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-xs leading-6 text-muted-foreground">
          <span>{t("copyright", { year })}</span>
          <nav
            aria-label={locale === "ar" ? "المعلومات القانونية" : "Legal information"}
            className="flex flex-wrap gap-x-5 gap-y-2"
          >
            <Link
              href="/privacy"
              className="rounded-md underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-ring"
            >
              {t("privacy")}
            </Link>
            <Link
              href="/terms"
              className="rounded-md underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-ring"
            >
              {t("terms")}
            </Link>
          </nav>
          <span
            lang="en"
            dir="ltr"
          >
            MADAR · A home around your life
          </span>
        </div>
      </div>
    </footer>
  );
}
