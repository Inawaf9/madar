
"use client";

import { useLocale, useTranslations } from "next-intl";
import { useDirection } from "@base-ui/react/direction-provider";
import {
    X,
    House,
    LayoutDashboard,
    Users,
    CreditCard,
    Coins,
    ScrollText,
    Activity,
    ArrowLeft,
    ArrowRight,
} from "lucide-react";

import { Link, usePathname } from "@/i18n/navigation";
import { useIdentity } from "@/features/account/identity";
import { getLayoutCopy } from "@/messages/layout-copy";
import { Button } from "@/components/ui/button";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    useSidebar,
} from "@/components/ui/sidebar";
import { MadarLogo } from "@/components/branding/madar-logo";
import { currentNavigation, productNavigation } from "./navigation";

export function AppSidebar() {
    const locale = useLocale();
    const direction = useDirection();
    const sidebarSide = direction === "rtl" ? "right" : "left";
    const t = useTranslations("Workspace");
    const copy = getLayoutCopy(locale);
    const path = usePathname();

    const { user, role } = useIdentity();
    const { setOpenMobile, isMobile } = useSidebar();

    const isAdmin = role === "ADMIN";
    const isArabic = locale === "ar";
    const active = currentNavigation(path);

    const groupLabel = {
        primary: "sidebarPrimaryGroup",
        personal: "sidebarPersonalGroup",
        account: "sidebarAccountGroup",
    } as const;

    const close = () => setOpenMobile(false);

    const adminNavigation = [
        {
            label: isArabic ? "الرئيسية" : "Overview",
            href: "/admin",
            icon: LayoutDashboard,
        },
        {
            label: isArabic ? "إدارة المستخدمين" : "Users",
            href: "/admin/users",
            icon: Users,
        },
        {
            label: isArabic ? "المدفوعات" : "Payments",
            href: "/admin/payments",
            icon: CreditCard,
        },
        {
            label: isArabic ? "الأرصدة والباقات" : "Credits & Packages",
            href: "/admin/credits",
            icon: Coins,
        },
        {
            label: isArabic ? "سجل العمليات" : "Audit Logs",
            href: "/admin/audit-logs",
            icon: ScrollText,
        },
        {
            label: isArabic ? "حالة النظام" : "System Health",
            href: "/admin/system-health",
            icon: Activity,
        },
    ];

    return (
        <Sidebar
            variant="inset"
            collapsible="icon"
            side={sidebarSide}
            dir={direction}
            mobileTitle={copy.menu}
            mobileDescription={
                isAdmin
                    ? isArabic
                        ? "لوحة إدارة مدار"
                        : "MADAR Administration"
                    : copy.workspace
            }
        >
            <SidebarHeader className="pb-5 pt-4">
                <div className="flex items-center justify-between gap-2">
                    <Link
                        href={isAdmin ? "/admin" : "/dashboard"}
                        onClick={close}
                        aria-label={
                            isAdmin
                                ? isArabic
                                    ? "لوحة إدارة مدار"
                                    : "MADAR Administration"
                                : copy.dashboard
                        }
                        className="flex min-w-0 items-center gap-2.5 rounded-xl focus-visible:outline-2 focus-visible:outline-ring"
                    >
                        <MadarLogo decorative size="sm" />
                        <span className="min-w-0 group-data-[collapsible=icon]:hidden">
              <span className="block text-sm font-bold tracking-widest">
                MADAR
              </span>
              <span className="block text-caption text-muted-foreground">
                {isAdmin
                    ? isArabic
                        ? "لوحة الإدارة"
                        : "Admin Workspace"
                    : copy.workspace}
              </span>
            </span>
                    </Link>

                    {isMobile ? (
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={close}
                            aria-label={copy.close}
                        >
                            <X />
                        </Button>
                    ) : null}
                </div>
            </SidebarHeader>

            <SidebarContent className="group-data-[collapsible=icon]:overflow-y-auto">
                {isAdmin ? (
                    <nav
                        aria-label={
                            isArabic ? "القائمة الإدارية" : "Admin navigation"
                        }
                    >
                        <SidebarGroup className="gap-1 px-2 py-2">
                            <SidebarGroupLabel className="px-2 text-caption font-semibold tracking-wide text-sidebar-foreground/60">
                                {isArabic ? "إدارة مدار" : "MADAR Management"}
                            </SidebarGroupLabel>

                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {adminNavigation.map(({ label, href, icon: Icon }) => {
                                        const selected = path === href;

                                        return (
                                            <SidebarMenuItem key={href}>
                                                <SidebarMenuButton
                                                    render={<Link href={href} />}
                                                    onClick={close}
                                                    isActive={selected}
                                                    aria-current={selected ? "page" : undefined}
                                                    tooltip={{
                                                        children: label,
                                                        side: direction === "rtl" ? "left" : "right",
                                                    }}
                                                    className="h-11 gap-3 rounded-xl hover:bg-sidebar-accent/70 focus-visible:ring-2 focus-visible:ring-sidebar-ring data-active:bg-primary/10 data-active:font-semibold data-active:text-primary group-data-[collapsible=icon]:size-9! group-data-[collapsible=icon]:p-2.5! [&_svg]:size-4"
                                                >
                                                    <Icon aria-hidden="true" />
                                                    <span>{label}</span>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        );
                                    })}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </nav>
                ) : (
                    <nav aria-label={t("navigation")}>
                        {productNavigation.map(({ group, items }) => (
                            <SidebarGroup
                                key={group}
                                className="gap-1 px-2 py-2"
                            >
                                <SidebarGroupLabel className="px-2 text-caption font-semibold tracking-wide text-sidebar-foreground/60">
                                    {t(groupLabel[group])}
                                </SidebarGroupLabel>

                                <SidebarGroupContent>
                                    <SidebarMenu>
                                        {items.map(({ href, label, icon: Icon }) => (
                                            <SidebarMenuItem key={href}>
                                                <SidebarMenuButton
                                                    render={<Link href={href} />}
                                                    onClick={close}
                                                    isActive={active?.href === href}
                                                    aria-current={
                                                        active?.href === href ? "page" : undefined
                                                    }
                                                    tooltip={{
                                                        children: t(label),
                                                        side: direction === "rtl" ? "left" : "right",
                                                    }}
                                                    className="h-11 gap-3 rounded-xl hover:bg-sidebar-accent/70 focus-visible:ring-2 focus-visible:ring-sidebar-ring data-active:bg-primary/10 data-active:font-semibold data-active:text-primary group-data-[collapsible=icon]:size-9! group-data-[collapsible=icon]:p-2.5! [&_svg]:size-4"
                                                >
                                                    <Icon aria-hidden="true" />
                                                    <span>{t(label)}</span>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        ))}
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </SidebarGroup>
                        ))}
                    </nav>
                )}
            </SidebarContent>

            <SidebarFooter className="pt-2 pb-4">
                {isAdmin && (
                    <SidebarMenu className="mb-2">
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                render={<Link href="/" />}
                                onClick={close}
                                tooltip={{
                                    children: isArabic
                                        ? "العودة إلى الرئيسية"
                                        : "Back to Home",
                                    side: direction === "rtl" ? "left" : "right",
                                }}
                                className="h-11 gap-3 rounded-xl border border-primary/20 bg-primary/5 font-semibold text-primary hover:bg-primary/10 hover:text-primary group-data-[collapsible=icon]:size-9! group-data-[collapsible=icon]:p-2.5! [&_svg]:size-4"
                            >
                                <House aria-hidden="true" />
                                <span className="flex-1">
                  {isArabic
                      ? "العودة إلى الرئيسية"
                      : "Back to Home"}
                </span>
                                {isArabic ? (
                                    <ArrowLeft className="size-4 group-data-[collapsible=icon]:hidden" />
                                ) : (
                                    <ArrowRight className="size-4 group-data-[collapsible=icon]:hidden" />
                                )}
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                )}

                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            render={
                                <Link href={isAdmin ? "/admin" : "/profile"} />
                            }
                            onClick={close}
                            size="lg"
                            className="h-14 gap-3 rounded-xl hover:bg-sidebar-accent/70 group-data-[collapsible=icon]:size-9! focus-visible:ring-2 focus-visible:ring-sidebar-ring [&_svg]:size-4"
                            isActive={!isAdmin && active?.href === "/profile"}
                            aria-current={
                                !isAdmin && active?.href === "/profile"
                                    ? "page"
                                    : undefined
                            }
                            aria-label={
                                isAdmin
                                    ? isArabic
                                        ? "حساب المسؤول"
                                        : "Admin account"
                                    : t("profile")
                            }
                        >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold">
                {user.fullName.trim().charAt(0)}
              </span>
                            <span className="min-w-0 flex-1 text-start group-data-[collapsible=icon]:hidden">
                <span className="block truncate text-sm font-medium">
                  {user.fullName}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <SidebarRail
                aria-label={copy.toggleSidebar}
                title={copy.toggleSidebar}
            />
        </Sidebar>
    );
}
