import Image from "next/image";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export type MadarLogoProps = {
  size?: "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
  decorative?: boolean;
  className?: string;
};
const sizes = { sm: "size-8", md: "size-10", lg: "size-16", xl: "size-28" };

/** CSS follows the existing next-themes .dark class, including before hydration. */
export function MadarLogo({
  size = "md",
  showWordmark = false,
  decorative = false,
  className,
}: MadarLogoProps) {
  const t = useTranslations("Common");
  const mark = (
    <span
      role={!decorative && !showWordmark ? "img" : undefined}
      aria-label={!decorative && !showWordmark ? t("brand") : undefined}
      aria-hidden={decorative || showWordmark || undefined}
      className={cn(
        "relative inline-block aspect-square shrink-0",
        sizes[size],
        !showWordmark && className,
      )}
    >
      <Image
        src="/branding/madar-mark-navy.png"
        width={1200}
        height={1200}
        sizes="(max-width: 640px) 112px, 160px"
        alt=""
        className="block size-full object-contain dark:hidden"
      />
      <Image
        src="/branding/madar-mark-ivory.png"
        width={1200}
        height={1200}
        sizes="(max-width: 640px) 112px, 160px"
        alt=""
        className="hidden size-full object-contain dark:block"
      />
    </span>
  );
  return showWordmark ? (
    <span
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : t("brand")}
      aria-hidden={decorative || undefined}
      className={cn("inline-flex min-w-0 items-center gap-2.5", className)}
    >
      {mark}
      <span
        aria-hidden="true"
        className="truncate font-heading font-semibold"
      >
        {t("brand")}
      </span>
    </span>
  ) : (
    mark
  );
}
