"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { FormFieldRenderProps } from "@/components/forms/data-form";

type Props = FormFieldRenderProps & {
  kind: "fullName" | "email" | "password";
  newPassword?: boolean;
};
export function AuthField({
  kind,
  newPassword,
  id,
  value,
  onChange,
  invalid,
  describedBy,
  inputRef,
}: Props) {
  const t = useTranslations("AuthUI");
  const [visible, setVisible] = useState(false);
  const password = kind === "password";
  return (
    <div className="flex min-w-0 flex-col">
      <Input
        id={id}
        name={kind}
        ref={inputRef}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
        type={
          password ? (visible ? "text" : "password") : kind === "email" ? "email" : "text"
        }
        autoComplete={
          password
            ? newPassword
              ? "new-password"
              : "current-password"
            : kind === "email"
              ? "email"
              : "name"
        }
        inputMode={kind === "email" ? "email" : undefined}
        autoCapitalize={kind === "fullName" ? "words" : "none"}
        spellCheck={false}
        dir={kind === "fullName" ? undefined : "ltr"}
        maxLength={kind === "fullName" ? 100 : newPassword ? 64 : undefined}
        placeholder={t(`${kind}Placeholder`)}
        aria-invalid={invalid}
        aria-describedby={describedBy}
      />
      {password ? (
        <div className="mt-1 flex min-w-0 flex-wrap items-center justify-between gap-x-3">
          <Button
            type="button"
            variant="link"
            className="h-11 gap-2 px-0 text-sm text-muted-foreground hover:text-foreground"
            aria-controls={id}
            aria-pressed={visible}
            onClick={() => setVisible((previous) => !previous)}
          >
            {visible ? (
              <EyeOff
                aria-hidden="true"
                className="size-4"
              />
            ) : (
              <Eye
                aria-hidden="true"
                className="size-4"
              />
            )}
            {t(visible ? "hidePassword" : "showPassword")}
          </Button>
          {!newPassword ? (
            <Link
              href="/forgot-password"
              className="inline-flex min-h-11 items-center rounded-lg text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
            >
              {t("forgotLink")}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
