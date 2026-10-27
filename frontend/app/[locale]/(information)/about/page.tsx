import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { AboutStory } from "@/features/marketing/about/about-story";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const arabic = locale === "ar";
  return {
    title: arabic ? "حكاية مدار | من نحن" : "The MADAR story | About us",
    description: arabic
      ? "حكاية مدار: من سؤال وين بسكن إلى بيت يناسب يومك وحياتك."
      : "The MADAR story: from one question about where to live to finding a home that fits your day.",
    alternates: { languages: { ar: "/ar/about", en: "/en/about" } },
    openGraph: {
      title: arabic ? "حكاية مدار | من نحن" : "The MADAR story | About us",
      description: arabic
        ? "حكاية مدار: من سؤال وين بسكن إلى بيت يناسب يومك وحياتك."
        : "The MADAR story: from one question about where to live to finding a home that fits your day.",
      locale: arabic ? "ar_SA" : "en_US",
    },
  };
}

export default async function AboutPage() {
  return <AboutStory locale={await getLocale()} />;
}
