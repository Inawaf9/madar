import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function SiteBrand() {
  const common = useTranslations("Common");
  const locale = useLocale();
  return (
    <Link href="/" aria-label={common("brand")} className="inline-flex shrink-0 items-center gap-3 rounded-xl">
      <span aria-hidden="true" className="grid size-10 place-items-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground">م</span>
      <span className="flex flex-col gap-1 leading-none">
        <span className={cn("font-heading text-lg font-bold", locale === "en" && "tracking-[.08em]")}>{common("brand")}</span>
        <span className="text-[10px] text-muted-foreground">{common("brandTagline")}</span>
      </span>
    </Link>
  );
}
