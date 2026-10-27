import { useLocale } from "next-intl";
import type { ReactNode } from "react";

/** One announcement per loading section; decorative placeholders stay silent. */
export function LoadingStatus({
  children,
  label = "جارٍ تحميل المحتوى",
  className,
}: {
  children: ReactNode;
  label?: string;
  className?: string;
}) {
  const locale = useLocale();
  return (
    <div
      role="status"
      aria-busy="true"
      className={className}
    >
      <span className="sr-only">{locale === "ar" ? label : "Loading content"}</span>
      <div
        aria-hidden="true"
        className="min-w-0"
      >
        {children}
      </div>
    </div>
  );
}
