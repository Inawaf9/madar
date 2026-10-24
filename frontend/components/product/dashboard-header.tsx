"use client";

import { useLocale, useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { getLayoutCopy } from "@/components/layout/copy";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { currentNavigation } from "./navigation";

export function DashboardHeader() {
  const locale = useLocale(); const copy = getLayoutCopy(locale); const t = useTranslations("Workspace"); const path = usePathname(); const item = currentNavigation(path);
  const detail = item && path !== item.href && !path.startsWith("/payments/return");
  return <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-border/60 bg-background/95 px-4 backdrop-blur-sm sm:px-6 md:top-2 md:rounded-t-2xl lg:px-8">
    <SidebarTrigger aria-label={copy.toggleSidebar} className="size-10 shrink-0" />
    <span aria-hidden="true" className="mx-1 h-4 w-px bg-border" />
    <Breadcrumb aria-label={copy.menu} className="min-w-0 flex-1"><BreadcrumbList className="flex-nowrap overflow-hidden">
      <BreadcrumbItem className="hidden shrink-0 sm:inline-flex"><BreadcrumbLink render={<Link href="/dashboard" />}>{copy.primary}</BreadcrumbLink></BreadcrumbItem>
      <BreadcrumbSeparator className="hidden sm:block" />
      <BreadcrumbItem className="min-w-0">{detail ? <BreadcrumbLink render={<Link href={item.href} />} className="truncate">{t(item.label)}</BreadcrumbLink> : <BreadcrumbPage className="truncate">{item ? t(item.label) : copy.workspace}</BreadcrumbPage>}</BreadcrumbItem>
      {detail ? <><BreadcrumbSeparator /><BreadcrumbItem className="shrink-0"><BreadcrumbPage>{copy.details}</BreadcrumbPage></BreadcrumbItem></> : null}
    </BreadcrumbList></Breadcrumb>
    <div className="flex shrink-0 items-center gap-0.5"><Button nativeButton={false} render={<Link href="/properties" />} variant="ghost" size="icon" aria-label={copy.publicSearch} className="hidden sm:inline-flex"><Search /></Button><LanguageSwitcher /><ThemeToggle /></div>
  </header>;
}
