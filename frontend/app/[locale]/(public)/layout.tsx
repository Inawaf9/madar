import { MarketingShell } from "@/features/marketing/site/marketing-shell";
import { PageContainer } from "@/components/layout/page-container";
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <MarketingShell mainClassName="min-h-[65vh]">
      <PageContainer className="py-8 sm:py-10">{children}</PageContainer>
    </MarketingShell>
  );
}
