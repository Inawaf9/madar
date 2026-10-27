"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  CircleUserRound,
  House,
  LoaderCircle,
  LogOut,
  MoreHorizontal,
  Search,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { useIdentity } from "@/features/account/identity";
import { getLayoutCopy } from "@/messages/layout-copy";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { currentNavigation } from "./navigation";

export function DashboardHeader() {
  const locale = useLocale();
  const copy = getLayoutCopy(locale);
  const t = useTranslations("Workspace");
  const auth = useTranslations("Auth");
  const { role, logout, logoutAll, signingOut } = useIdentity();
  const path = usePathname();
  const item = currentNavigation(path);
  const detail = item && path !== item.href && !path.startsWith("/payments/return");
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/60 bg-background/95 px-4 backdrop-blur-sm sm:px-6 md:top-2 md:rounded-t-2xl lg:px-8">
      <SidebarTrigger
        aria-label={copy.toggleSidebar}
        className="size-10 shrink-0"
      />
      <span
        aria-hidden="true"
        className="mx-1 h-4 w-px bg-border"
      />
      <Breadcrumb
        aria-label={copy.menu}
        className="min-w-0 flex-1"
      >
        <BreadcrumbList className="flex-nowrap overflow-hidden">
          <BreadcrumbItem className="hidden shrink-0 sm:inline-flex">
            <BreadcrumbLink render={<Link href="/dashboard" />}>
              {copy.primary}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden sm:block" />
          <BreadcrumbItem className="min-w-0">
            {detail ? (
              <BreadcrumbLink
                render={<Link href={item.href} />}
                className="truncate"
              >
                {t(item.label)}
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage className="truncate">
                {item ? t(item.label) : copy.workspace}
              </BreadcrumbPage>
            )}
          </BreadcrumbItem>
          {detail ? (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="shrink-0">
                <BreadcrumbPage>{copy.details}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ) : null}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex shrink-0 items-center gap-0.5">
        <Button
          nativeButton={false}
          render={<Link href="/properties" />}
          variant="ghost"
          size="icon"
          aria-label={copy.publicSearch}
          className="hidden sm:inline-flex"
        >
          <Search aria-hidden="true" />
        </Button>
        <Button
          nativeButton={false}
          render={<Link href="/" />}
          variant="ghost"
          size="sm"
          aria-label={t("backHome")}
          title={t("backHome")}
          className="hidden size-10 sm:inline-flex xl:h-9 xl:w-auto xl:px-3"
        >
          <House
            data-icon="inline-start"
            aria-hidden="true"
          />
          <span className="hidden xl:inline">{t("backHome")}</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={signingOut}
          aria-label={signingOut ? t("working") : t("logout")}
          title={signingOut ? t("working") : t("logout")}
          aria-busy={signingOut}
          onClick={() => void logout()}
          className="hidden size-10 sm:inline-flex xl:h-9 xl:w-auto xl:px-3"
        >
          {signingOut ? (
            <LoaderCircle
              data-icon="inline-start"
              aria-hidden="true"
              className="animate-spin"
            />
          ) : (
            <LogOut
              data-icon="inline-start"
              aria-hidden="true"
            />
          )}
          <span className="hidden xl:inline">
            {signingOut ? t("working") : t("logout")}
          </span>
        </Button>
        <LanguageSwitcher />
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-10 xl:size-9"
                aria-label={signingOut ? t("working") : copy.accountMenu}
                aria-busy={signingOut}
                disabled={signingOut}
              />
            }
          >
            {signingOut ? (
              <LoaderCircle
                aria-hidden="true"
                className="animate-spin"
              />
            ) : (
              <MoreHorizontal aria-hidden="true" />
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 max-w-[calc(100vw-2rem)] motion-reduce:animate-none"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel>{copy.accountNote}</DropdownMenuLabel>
              <DropdownMenuItem
                render={<Link href="/" />}
                className="sm:hidden"
              >
                <House aria-hidden="true" />
                {t("backHome")}
              </DropdownMenuItem>
              {role === "ADMIN" ? (
                <DropdownMenuItem render={<Link href="/admin" />}>
                  <CircleUserRound aria-hidden="true" />
                  {auth("admin")}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="sm:hidden"
                disabled={signingOut}
                onClick={() => void logout()}
              >
                <LogOut aria-hidden="true" />
                {t("logout")}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={signingOut}
                onClick={() => void logoutAll()}
              >
                <LogOut aria-hidden="true" />
                {auth("logoutAll")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
