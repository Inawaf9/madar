import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { LandingPage } from "@/features/marketing/landing/landing-page";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const arabic = locale === "ar";
  return {
    title: arabic ? "مدار | بيت يناسب يومك" : "MADAR | Find a home that fits your day",
    description: arabic
      ? "تصفّح البيوت وقارن بينها حسب ميزانيتك ومشاويرك والأماكن اللي تهمك."
      : "Explore and compare homes by budget, commute, and the places that matter to you.",
    alternates: { languages: { ar: "/ar", en: "/en" } },
    openGraph: {
      locale: arabic ? "ar_SA" : "en_US",
      alternateLocale: [arabic ? "en_US" : "ar_SA"],
    },
  };
}

export default function Page() {
  return <LandingPage />;
}
