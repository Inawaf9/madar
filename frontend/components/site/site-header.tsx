"use client";

import { Suspense, useEffect, useRef, useState, type ComponentProps } from "react";
import { ArrowUpRight, Bookmark, Menu, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { usePrefetchLocations } from "@/features/properties/use-prefetch-locations";
import { useLocalUserId } from "@/features/account/use-local-user-id";
import { Button, buttonVariants } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";
import { SiteBrand } from "./site-brand";
import { getLayoutCopy } from "@/components/layout/copy";

const sections = [["#discover", "discover"], ["#personalize", "personalize"], ["#compare", "compare"], ["#how-it-works", "howItWorks"]] as const;
type RouteLinkProps = Omit<ComponentProps<typeof Link>, "aria-current">;

function ActiveRouteLink(props: RouteLinkProps) {
  const path = usePathname();
  return <Link {...props} aria-current={path === props.href ? "page" : undefined} />;
}

/** Only the active-link marker needs URL data; the navigation still prerenders. */
function RouteLink(props: RouteLinkProps) {
  return <Suspense fallback={<Link {...props} />}><ActiveRouteLink {...props} /></Suspense>;
}

export function SiteHeader() {
  const t = useTranslations("Navigation"); const common = useTranslations("Common"); const product = useTranslations("Workspace");
  const locale = useLocale(); const copy = getLayoutCopy(locale); const userId = useLocalUserId();
  const prefetchLocations = usePrefetchLocations(); const [open, setOpen] = useState(false);
  const header = useRef<HTMLDivElement>(null); const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (event.target instanceof Node && !header.current?.contains(event.target)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); setOpen(false); trigger.current?.focus(); } };
    document.addEventListener("pointerdown", outside); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);
  const close = () => setOpen(false);
  const accountHref = userId ? "/dashboard" : "/login";
  const accountLabel = userId ? copy.dashboard : t("login");
  const intent = { onPointerEnter: prefetchLocations, onFocus: prefetchLocations, onTouchStart: prefetchLocations };
  return <header className="sticky top-3 z-40 mt-3 w-full min-w-0 px-3 sm:top-5 sm:mt-5 sm:px-6">
    <Collapsible ref={header} open={open} onOpenChange={setOpen} className="mx-auto w-full min-w-0 max-w-7xl rounded-3xl border border-border/70 bg-card/95 shadow-sm backdrop-blur-md">
      <div className="flex h-16 min-w-0 items-center justify-between gap-3 px-3 sm:h-18 sm:px-6">
        <div className="min-w-0 flex-1 xl:flex-none"><SiteBrand compact onClick={close} /></div>
        <nav aria-label={t("home")} className="hidden min-w-0 items-center gap-1 xl:flex">{sections.map(([href, key]) => <Link key={href} href={`/${href}`} className="rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">{t(key)}</Link>)}</nav>
        <div className="hidden shrink-0 items-center gap-1.5 xl:flex">
          <RouteLink href="/saved" aria-label={product("saved")} className={buttonVariants({ variant: "ghost", size: "icon" })}><Bookmark /></RouteLink>
          <LanguageSwitcher /><ThemeToggle />
          <RouteLink href={accountHref} className={buttonVariants({ variant: "outline" })}>{accountLabel}</RouteLink>
          <RouteLink href="/properties" {...intent} className={buttonVariants()}>{common("explore")}<ArrowUpRight data-icon="inline-end" className="rtl:-scale-x-100" /></RouteLink>
        </div>
        <CollapsibleTrigger render={<Button ref={trigger} variant="ghost" size="icon-lg" className="shrink-0 xl:hidden" aria-label={open ? t("closeMenu") : t("openMenu")} />}>{open ? <X /> : <Menu />}</CollapsibleTrigger>
      </div>
      <CollapsibleContent className="h-(--collapsible-panel-height) w-full min-w-0 overflow-hidden transition-[height,opacity] duration-150 data-ending-style:h-0 data-starting-style:h-0 data-ending-style:opacity-0 data-starting-style:opacity-0 xl:hidden motion-reduce:transition-none">
        <div className="max-h-[calc(100svh-7rem)] min-w-0 overflow-y-auto overscroll-contain px-3 pb-4 sm:px-6">
          <nav aria-label={copy.mobileMenu} className="flex min-w-0 flex-col gap-1">{sections.map(([href, key]) => <Link key={href} href={`/${href}`} onClick={close} className="flex min-h-11 min-w-0 items-center rounded-xl px-3 py-2 text-sm wrap-break-word hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring">{t(key)}</Link>)}
            <RouteLink href="/properties" {...intent} onClick={close} className="flex min-h-11 min-w-0 items-center rounded-xl px-3 py-2 text-sm wrap-break-word hover:bg-secondary aria-[current=page]:bg-secondary aria-[current=page]:font-semibold">{product("properties")}</RouteLink>
            <RouteLink href="/saved" onClick={close} className="flex min-h-11 min-w-0 items-center rounded-xl px-3 py-2 text-sm wrap-break-word hover:bg-secondary aria-[current=page]:bg-secondary aria-[current=page]:font-semibold">{product("saved")}</RouteLink>
          </nav>
          <RouteLink href={accountHref} onClick={close} className={buttonVariants({ className: "mt-3 h-auto min-h-11 w-full min-w-0 py-2.5 whitespace-normal wrap-break-word" })}>{accountLabel}</RouteLink>
          <div className="mt-3 flex min-w-0 flex-wrap items-center justify-between gap-3"><LanguageSwitcher /><ThemeToggle /></div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  </header>;
}
