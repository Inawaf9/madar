import { useTranslations } from "next-intl";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { HeroSection } from "./hero-section";
import { PropertyDiscoverySection } from "./property-discovery-section";
import { PersonalizedLocationsSection } from "./personalized-locations-section";
import { PropertyComparisonSection } from "./property-comparison-section";
import { HowItWorksSection } from "./how-it-works-section";
import { FeaturesSection } from "./features-section";
import { FinalCTASection } from "./final-cta-section";

export function LandingPage() {
  const t = useTranslations("Common");
  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-3 focus:text-primary-foreground">{t("skipToContent")}</a>
      <SiteHeader />
      <main id="main-content">
        <HeroSection />
        <PropertyDiscoverySection />
        <PersonalizedLocationsSection />
        <PropertyComparisonSection />
        <HowItWorksSection />
        <FeaturesSection />
        <FinalCTASection />
      </main>
      <SiteFooter />
    </>
  );
}
