"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import type { FormFieldRenderProps } from "@/components/forms/data-form";

function LegalLink({
  href,
  children,
}: {
  href: "/terms" | "/privacy";
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-sm font-medium text-primary underline underline-offset-4 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
    >
      {children}
    </Link>
  );
}

export function RegistrationConsent({
  id,
  value,
  onChange,
  invalid,
  describedBy,
  inputRef,
}: FormFieldRenderProps) {
  const t = useTranslations("AuthUI");
  const arabic = useLocale() === "ar";
  return (
    <div className="flex min-w-0 items-start gap-3">
      <Checkbox
        id={id}
        ref={inputRef}
        checked={value === true}
        onCheckedChange={(checked) => onChange(checked === true)}
        aria-invalid={invalid}
        aria-required="true"
        aria-describedby={describedBy}
        className="mt-1"
      />
      <span className="min-w-0 text-sm leading-7 text-foreground">
        <label
          htmlFor={id}
          className="cursor-pointer"
        >
          {t("consentLead")}
        </label>{" "}
        <LegalLink href="/terms">{t("termsLink")}</LegalLink>{" "}
        <label
          htmlFor={id}
          className="cursor-pointer"
        >
          {t("legalJoin")}
        </label>
        {arabic ? null : " "}
        <LegalLink href="/privacy">{t("privacyLink")}</LegalLink>
        {t("consentPeriod")}
      </span>
    </div>
  );
}

export function LoginLegalNotice() {
  const t = useTranslations("AuthUI");
  return (
    <p className="mt-4 text-center text-xs leading-6 text-muted-foreground sm:text-sm">
      {t.rich("loginLegalNotice", {
        terms: (children) => <LegalLink href="/terms">{children}</LegalLink>,
        privacy: (children) => <LegalLink href="/privacy">{children}</LegalLink>,
      })}
    </p>
  );
}
