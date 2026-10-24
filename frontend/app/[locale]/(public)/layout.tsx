import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { PageContainer } from "@/components/layout/page-container";
export default function PublicLayout({ children }: { children: React.ReactNode }) { return <><SiteHeader /><PageContainer as="main" className="min-h-[65vh] py-8 sm:py-10">{children}</PageContainer><SiteFooter /></>; }
