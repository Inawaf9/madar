import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { LandingPage } from "@/components/landing/landing-page";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const arabic = locale === "ar";
  return {
    title: arabic ? "مدار | بيتك المناسب بناءً على حياتك" : "MADAR | The right home, built around your life",
    description: arabic
      ? "اكتشف خيارات السكن وقارن بينها وفق المواقع التي تهمك وإيقاع يومك."
      : "Explore and compare homes around the places that matter and the rhythm of your day.",
    alternates: { languages: { ar: "/ar", en: "/en" } },
    openGraph: { locale: arabic ? "ar_SA" : "en_US", alternateLocale: [arabic ? "en_US" : "ar_SA"] },
  };
}

export default function Page() {
  return <LandingPage />;
}
