import { MarketingShell } from "@/features/marketing/site/marketing-shell";

export default function InformationLayout({ children }: { children: React.ReactNode }) {
  return <MarketingShell footerFlush>{children}</MarketingShell>;
}
