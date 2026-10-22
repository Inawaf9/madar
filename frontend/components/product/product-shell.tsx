"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { House, Bookmark, MapPin, Columns3, CircleUserRound, Menu, LogOut, Search } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { IdentityGate, useIdentity } from "@/features/product/identity";

const links = [ ["/dashboard", "dashboard", House], ["/properties", "properties", Search], ["/saved", "saved", Bookmark], ["/locations", "locations", MapPin], ["/compare", "compare", Columns3], ["/profile", "profile", CircleUserRound], ["/interests", "interests", Bookmark], ["/neighborhood", "neighborhood", MapPin], ["/payments", "payments", Bookmark] ] as const;
function AppChrome({ children }: { children: React.ReactNode }) {
  const t = useTranslations("Workspace"); const path = usePathname(); const locale = useLocale(); const [open, setOpen] = useState(false); const { user, logout } = useIdentity();
  const navigation = <nav aria-label={t("navigation")} className="flex flex-col gap-2">{links.map(([href, label, Icon]) => <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={path === href || path.startsWith(`${href}/`) ? "page" : undefined} className={cn("flex min-h-12 items-center gap-3 rounded-xl px-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring", (path === href || path.startsWith(`${href}/`)) && "bg-primary text-primary-foreground hover:bg-primary/90")}><Icon className="size-4" />{t(label)}</Link>)}</nav>;
  const logo = <Link href="/dashboard" className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground">م</span><span className="font-heading font-semibold tracking-[0.1em]">MADAR</span></Link>;
  return <div className="min-h-screen bg-background"><a href="#product-content" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:bg-card focus:p-3">{t("skip")}</a><header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur"><div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between gap-2 px-4 sm:px-8">{logo}<div className="flex items-center gap-1"><span className="hidden sm:block"><LanguageSwitcher /></span><ThemeToggle /><Button variant="ghost" className="hidden max-w-36 md:inline-flex" nativeButton={false} render={<Link href="/profile" />}><CircleUserRound data-icon="inline-start" /><span className="truncate">{user.fullName}</span></Button><Button variant="ghost" size="icon-lg" onClick={() => void logout()} aria-label={t("logout")}><LogOut /></Button><Sheet open={open} onOpenChange={setOpen}><SheetTrigger render={<Button variant="outline" size="icon-lg" className="lg:hidden" aria-label={t("navigation")} />}><Menu /></SheetTrigger><SheetContent side={locale === "ar" ? "right" : "left"}><SheetHeader><SheetTitle>{t("navigation")}</SheetTitle></SheetHeader><div className="flex flex-col gap-4 p-4">{navigation}<span className="sm:hidden"><LanguageSwitcher /></span></div></SheetContent></Sheet></div></div></header><div className="mx-auto grid max-w-[1600px] lg:grid-cols-[235px_minmax(0,1fr)]"><aside className="sticky top-20 hidden h-[calc(100svh-5rem)] flex-col justify-between border-e px-5 py-8 lg:flex">{navigation}<div className="flex flex-col gap-4"><p className="px-4 text-xs leading-5 text-muted-foreground">{t("developmentNote")}</p><Link href="/" className="px-4 text-sm text-muted-foreground hover:text-foreground">{t("backHome")}</Link></div></aside><main id="product-content" className="min-w-0 px-4 py-8 sm:px-8 lg:p-10">{children}</main></div></div>;
}
export function ProductShell({ children }: { children: React.ReactNode }) { return <IdentityGate><AppChrome>{children}</AppChrome></IdentityGate>; }
