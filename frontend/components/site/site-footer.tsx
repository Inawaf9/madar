import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SiteBrand } from "./site-brand";

export function SiteFooter() {
  const t = useTranslations("Footer");
  const nav = useTranslations("Navigation");
  const product = useTranslations("Workspace");
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 md:grid-cols-[1.3fr_.7fr] lg:px-12">
        <div className="max-w-md"><SiteBrand /><p className="mt-4 text-sm leading-7 text-muted-foreground">{t("description")}</p></div>
        <div className="flex flex-col gap-4 md:items-end">
          <p className="text-xs font-bold">{t("product")}</p>
          <nav aria-label={t("product")} className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground md:justify-end">
            {[["/#discover", t("discover")], ["/#compare", t("compare")], ["/#how-it-works", nav("howItWorks")], ["/properties", product("properties")], ["/saved", product("saved")]].map(([href, label]) => <Link key={href} href={href} className="inline-flex min-h-11 items-center rounded-sm hover:text-foreground">{label}</Link>)}
          </nav>
        </div>
      </div>
      <div className="border-t"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4 text-xs text-muted-foreground sm:px-8 lg:px-12"><span>{t("copyright", { year: 2026 })}</span><span lang="en" dir="ltr">Stone & Ink — Saudi Living</span></div></div>
    </footer>
  );
}
