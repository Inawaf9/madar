import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import { ThemeToggle } from "@/components/site/theme-toggle";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const common = await getTranslations("Common");
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/80 bg-background/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-ring" aria-label={common("brand")}>
            <span className="grid size-9 place-items-center rounded-xl bg-primary font-heading text-lg font-semibold text-primary-foreground">م</span>
            <span className="font-heading text-base font-semibold tracking-[0.08em]">MADAR</span>
          </Link>
          <div className="flex items-center gap-1"><LanguageSwitcher /><ThemeToggle /></div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 sm:px-6">{children}</main>
    </div>
  );
}
