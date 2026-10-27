import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { MadarLogo } from "@/components/branding/madar-logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const common = await getTranslations("Common");
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/80 bg-background/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-ring"
            aria-label={common("brand")}
          >
            <MadarLogo
              decorative
              size="sm"
              showWordmark
            />
          </Link>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 sm:px-6">{children}</main>
    </div>
  );
}
