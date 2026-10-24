"use client";

import { useLocale, useTranslations } from "next-intl";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { IdentityGate } from "@/features/account/identity";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "./app-sidebar";
import { DashboardHeader } from "./dashboard-header";
import { PageContainer } from "@/components/layout/page-container";

function AppChrome({ children }: { children: React.ReactNode }) {
  const locale = useLocale(); const t = useTranslations("Workspace"); const direction = locale === "ar" ? "rtl" : "ltr";
  return <DirectionProvider direction={direction}><TooltipProvider delay={250}>
    <SidebarProvider dir={direction} defaultOpen style={{ "--sidebar-width": "15rem", "--sidebar-width-icon": "3.25rem" } as React.CSSProperties}>
      <a href="#product-content" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-card focus:p-3">{t("skip")}</a>
      <AppSidebar />
      <SidebarInset className="min-w-0 md:ring-1 md:ring-border/50"><DashboardHeader /><PageContainer width="dashboard" id="product-content" tabIndex={-1} className="flex-1 pt-6 pb-[var(--assistant-content-clearance,calc(5.5rem+env(safe-area-inset-bottom)))] outline-none lg:pt-8">{children}</PageContainer></SidebarInset>
    </SidebarProvider>
  </TooltipProvider></DirectionProvider>;
}
export function ProductShell({ children }: { children: React.ReactNode }) {
  return <IdentityGate><AppChrome>{children}</AppChrome></IdentityGate>;
}
