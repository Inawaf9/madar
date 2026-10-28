import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { locale as getRootLocale } from "next/root-params";
import { SessionProvider } from "@/features/auth/session-provider";
import { AssistantProvider } from "@/features/assistant/assistant-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { routing } from "@/i18n/routing";
import { thmanyahSans, thmanyahDisplay } from "../fonts";
import "../globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const arabic = (await getLocale()) === "ar";
  return {
    title: {
      default: arabic
        ? "مدار | بيت يناسب يومك"
        : "MADAR | Find a home that fits your day",
      template: "%s | MADAR",
    },
    description: arabic
      ? "تصفّح البيوت وقارن بينها حسب ميزانيتك ومشاويرك والأماكن اللي تهمك."
      : "Explore and compare homes by budget, commute, and the places that matter to you.",
    icons: {
      icon: [
        {
          url: "/branding/icons/madar-mark-navy-32.png",
          sizes: "32x32",
          type: "image/png",
          media: "(prefers-color-scheme: light)",
        },
        {
          url: "/branding/icons/madar-mark-ivory-32.png",
          sizes: "32x32",
          type: "image/png",
          media: "(prefers-color-scheme: dark)",
        },
        {
          url: "/branding/icons/madar-mark-navy-192.png",
          sizes: "192x192",
          type: "image/png",
          media: "(prefers-color-scheme: light)",
        },
        {
          url: "/branding/icons/madar-mark-ivory-192.png",
          sizes: "192x192",
          type: "image/png",
          media: "(prefers-color-scheme: dark)",
        },
      ],
    },
    openGraph: {
      title: arabic ? "مدار | بيت يناسب يومك" : "MADAR | Find a home that fits your day",
      description: arabic
        ? "تصفّح البيوت وقارن بينها حسب ميزانيتك ومشاويرك والأماكن اللي تهمك."
        : "Explore and compare homes by budget, commute, and the places that matter to you.",
      siteName: "MADAR",
      type: "website",
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children }: { children: React.ReactNode }) {
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
      <body
        suppressHydrationWarning
        className="min-h-dvh bg-background font-sans text-foreground"
      >
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <QueryProvider>
              <SessionProvider>
                {children}
                <AssistantProvider chatEnabled />
              </SessionProvider>
            </QueryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
