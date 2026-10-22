"use client";

import { useState } from "react";
import { ArrowUpLeft, Bookmark, Menu, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";
import { SiteBrand } from "./site-brand";

const sections = [["#discover", "discover"], ["#personalize", "personalize"], ["#compare", "compare"], ["#how-it-works", "howItWorks"]] as const;

export function SiteHeader() {
  const t = useTranslations("Navigation");
  const common = useTranslations("Common");
  const product = useTranslations("Workspace");
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-3 px-5 sm:px-8 lg:px-12">
        <SiteBrand />
        <nav aria-label={t("home")} className="hidden items-center gap-5 xl:flex">
          {sections.map(([href, key]) => <a key={href} href={`/${locale}/${href}`} className="rounded-sm py-3 text-sm text-muted-foreground transition-colors hover:text-foreground">{t(key)}</a>)}
        </nav>
        <div className="flex min-w-0 items-center gap-1.5">
          <Link href="/saved" className={buttonVariants({ variant: "ghost", className: "hidden sm:inline-flex" })}><Bookmark data-icon="inline-start" />{product("saved")}</Link>
          <span className="hidden md:block"><LanguageSwitcher /></span>
          <ThemeToggle />
          <Link href="/login" className="hidden rounded-xl px-3 py-2 text-sm text-muted-foreground hover:text-foreground xl:block">{t("login")}</Link>
          <Link href="/properties" className={buttonVariants({ size: "lg", className: "hidden lg:inline-flex" })}>{common("explore")}<ArrowUpLeft data-icon="inline-end" className="rtl:-scale-x-100" /></Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button variant="outline" size="icon-lg" className="xl:hidden" aria-label={t("openMenu")} />}><Menu /></SheetTrigger>
            <SheetContent side={locale === "ar" ? "right" : "left"} showCloseButton={false} className="w-[min(90vw,24rem)] overflow-y-auto pb-6">
              <SheetHeader className="pe-14"><SheetTitle>{t("menu")}</SheetTitle></SheetHeader>
              <SheetClose render={<Button variant="ghost" size="icon-lg" className="absolute end-4 top-4" aria-label={t("closeMenu")} />}><X /></SheetClose>
              <nav aria-label={t("menu")} className="flex flex-col gap-2 px-6">
                {sections.map(([href, key]) => <a key={href} href={`/${locale}/${href}`} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm hover:bg-muted">{t(key)}</a>)}
                <Link href="/saved" onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm hover:bg-muted">{product("saved")}</Link>
                <Link href="/login" onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm hover:bg-muted">{t("login")}</Link>
                <LanguageSwitcher />
                <Link href="/properties" onClick={() => setOpen(false)} className={buttonVariants({ size: "lg", className: "mt-2" })}>{common("explore")}</Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
