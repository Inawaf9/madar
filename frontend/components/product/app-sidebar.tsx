"use client";

import { useLocale, useTranslations } from "next-intl";
import { useDirection } from "@base-ui/react/direction-provider";
import { ChevronsUpDown, CircleUserRound, House, LogOut, X } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { useIdentity } from "@/features/account/identity";
import { getLayoutCopy } from "@/components/layout/copy";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, SidebarSeparator, useSidebar } from "@/components/ui/sidebar";
import { MadarLogo } from "@/components/branding/madar-logo";
import { currentNavigation, productNavigation } from "./navigation";

export function AppSidebar() {
  const locale = useLocale(); const direction = useDirection();
  const sidebarSide = direction === "rtl" ? "right" : "left";
  const t = useTranslations("Workspace"); const copy = getLayoutCopy(locale); const path = usePathname();
  const { user, logout } = useIdentity(); const { setOpenMobile, isMobile } = useSidebar();
  const active = currentNavigation(path); const close = () => setOpenMobile(false);
  return <Sidebar variant="inset" collapsible="icon" side={sidebarSide} dir={direction} mobileTitle={copy.menu} mobileDescription={copy.workspace}>
    <SidebarHeader className="pb-4 pt-4">
      <div className="flex items-center justify-between gap-2">
        <Link href="/dashboard" onClick={close} aria-label={copy.dashboard} className="flex min-w-0 items-center gap-2.5 rounded-xl focus-visible:outline-2 focus-visible:outline-ring">
          <MadarLogo decorative size="sm" />
          <span className="min-w-0 group-data-[collapsible=icon]:hidden"><span className="block text-sm font-bold tracking-widest">MADAR</span><span className="block text-caption text-muted-foreground">{copy.workspace}</span></span>
        </Link>
        {isMobile ? <Button size="icon" variant="ghost" onClick={close} aria-label={copy.close}><X /></Button> : null}
      </div>
    </SidebarHeader>
    <SidebarContent className="group-data-[collapsible=icon]:overflow-y-auto"><nav aria-label={t("navigation")}>{productNavigation.map(({ group, items }) => <SidebarGroup key={group}>
      <SidebarGroupLabel className="text-caption font-medium">{copy[group]}</SidebarGroupLabel>
      <SidebarGroupContent><SidebarMenu>{items.map(({ href, label, icon: Icon }) => <SidebarMenuItem key={href}>
        <SidebarMenuButton render={<Link href={href} />} onClick={close} isActive={active?.href === href} aria-current={active?.href === href ? "page" : undefined} tooltip={{ children: t(label), side: direction === "rtl" ? "left" : "right" }} className="h-11 gap-3 rounded-xl data-active:bg-primary/10 data-active:font-semibold data-active:text-primary group-data-[collapsible=icon]:size-9! group-data-[collapsible=icon]:p-2.5!">
          <Icon aria-hidden="true" /><span>{t(label)}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>)}</SidebarMenu></SidebarGroupContent>
    </SidebarGroup>)}</nav></SidebarContent>
    <SidebarSeparator />
    <SidebarFooter className="pb-4">
      <SidebarMenu><SidebarMenuItem><DropdownMenu>
        <DropdownMenuTrigger render={<SidebarMenuButton size="lg" className="h-14 group-data-[collapsible=icon]:size-9!" aria-label={copy.accountMenu} />}>
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold">{user.fullName.trim().charAt(0)}</span>
          <span className="min-w-0 flex-1 text-start group-data-[collapsible=icon]:hidden"><span className="block truncate text-sm font-medium">{user.fullName}</span><span className="block truncate text-xs text-muted-foreground">{user.email}</span></span><ChevronsUpDown className="ms-auto group-data-[collapsible=icon]:hidden" />
        </DropdownMenuTrigger>
        <DropdownMenuContent side={isMobile ? "top" : direction === "rtl" ? "left" : "right"} align="end" className="w-64 max-w-[calc(100vw-2rem)] motion-reduce:animate-none">
          <DropdownMenuGroup><DropdownMenuLabel>{copy.accountNote}</DropdownMenuLabel>
            <DropdownMenuItem render={<Link href="/profile" />} onClick={close}><CircleUserRound />{t("profile")}</DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/" />} onClick={close}><House />{t("backHome")}</DropdownMenuItem>
          </DropdownMenuGroup><DropdownMenuSeparator />
          <DropdownMenuGroup><DropdownMenuItem variant="destructive" onClick={() => { close(); void logout(); }}><LogOut />{t("logout")}</DropdownMenuItem></DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu></SidebarMenuItem></SidebarMenu>
    </SidebarFooter>
    <SidebarRail aria-label={copy.toggleSidebar} title={copy.toggleSidebar} />
  </Sidebar>;
}
