import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { routing } from "@/i18n/routing";
import { thmanyahSans, thmanyahDisplay } from "../fonts";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "MADAR | مدار", template: "%s | MADAR" },
  description:
    "Discover a home that fits your daily life. Compare Riyadh properties around the places and routines that matter to you.",
  openGraph: {
    title: "MADAR | A home that fits your life",
    description:
      "Explore and compare homes with the places and routines that matter to you in mind.",
    siteName: "MADAR",
    type: "website",
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  if (!hasLocale(routing.locales, locale)) notFound();

  const messages = await getMessages();
  const isArabic = locale === "ar";

  return (
    <html
      lang={locale}
      dir={isArabic ? "rtl" : "ltr"}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${thmanyahSans.variable} ${thmanyahDisplay.variable} antialiased`}
    >
      <body className="min-h-screen bg-background font-sans text-foreground">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <QueryProvider>
              {children}
            </QueryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
