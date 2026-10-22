import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
export default function PublicLayout({ children }: { children: React.ReactNode }) { return <><SiteHeader /><main className="mx-auto min-h-[65vh] max-w-7xl px-5 py-10 sm:px-8 lg:px-12">{children}</main><SiteFooter /></>; }
