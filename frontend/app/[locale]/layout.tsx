import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { locale as getRootLocale } from "next/root-params";
import { isUnauthenticatedBackendAccessEnabled } from "@/lib/api/access";
import { AssistantProvider } from "@/features/assistant/assistant-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { routing } from "@/i18n/routing";
import { thmanyahSans, thmanyahDisplay } from "../fonts";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "MADAR | مدار", template: "%s | MADAR" },
  description:
    "Discover a home that fits your daily life. Compare Riyadh properties around the places and routines that matter to you.",
  icons: {
    icon: [
      { url: "/branding/icons/madar-mark-navy-32.png", sizes: "32x32", type: "image/png", media: "(prefers-color-scheme: light)" },
      { url: "/branding/icons/madar-mark-ivory-32.png", sizes: "32x32", type: "image/png", media: "(prefers-color-scheme: dark)" },
      { url: "/branding/icons/madar-mark-navy-192.png", sizes: "192x192", type: "image/png", media: "(prefers-color-scheme: light)" },
      { url: "/branding/icons/madar-mark-ivory-192.png", sizes: "192x192", type: "image/png", media: "(prefers-color-scheme: dark)" },
    ],
  },
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
  // Validate the actual URL segment, not the translation config's safe fallback.
  const locale = await getRootLocale();
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
      {/* Browser extensions can inject attributes on body before hydration. */}
      <body suppressHydrationWarning className="min-h-dvh bg-background font-sans text-foreground">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <QueryProvider>
              {children}
              <AssistantProvider chatEnabled={isUnauthenticatedBackendAccessEnabled()} />
            </QueryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
