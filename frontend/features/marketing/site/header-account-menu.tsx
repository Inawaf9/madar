"use client";

import { useState } from "react";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { useLocale, useTranslations } from "next-intl";
import { LoaderCircle, LogOut, UserRound, type LucideIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type HeaderAccountLink = { href: string; label: string; icon: LucideIcon };

function initials(name?: string) {
  const words = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (!words.length) return null;
  const first = Array.from(words[0])[0];
  const last = words.length > 1 ? Array.from(words[words.length - 1])[0] : null;
  return `${first}${last ?? ""}`.toLocaleUpperCase();
}

export function HeaderAccountMenu({
  name,
  email,
  imageUrl,
  links,
  signingOut,
  onLogout,
}: {
  name?: string;
  email: string;
  imageUrl?: string | null;
  links: HeaderAccountLink[];
  signingOut: boolean;
  onLogout: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations("Navigation");
  const [open, setOpen] = useState(false);
  const letters = initials(name);

  return (
    <DirectionProvider direction={locale === "ar" ? "rtl" : "ltr"}>
      <DropdownMenu
        open={open}
        onOpenChange={setOpen}
      >
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="icon"
              className="flex w-fit min-h-11 min-w-0 items-center rounded-xl px-3 py-2 text-sm wrap-break-word hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring"
              disabled={signingOut}
              aria-label={t("accountMenu")}
            />
          }
        >
          <span>مرحبا {name}</span>
          {/* <Avatar
            size="lg"
            className="size-9"
            aria-hidden="true"
          >
            {imageUrl ? (
              <AvatarImage
                src={imageUrl}
                alt=""
              />
            ) : null}
            <AvatarFallback className="bg-secondary font-semibold text-secondary-foreground">
              {signingOut ? (
                <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
              ) : (
                (letters ?? <UserRound className="size-4" />)
              )}
            </AvatarFallback>
          </Avatar> */}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="w-64 max-w-[calc(100vw-1.5rem)] motion-reduce:animate-none"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel className="px-3 py-2">
              <span className="block truncate text-sm font-semibold text-popover-foreground">
                {name || t("account")}
              </span>
              <span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">
                <bdi>{email}</bdi>
              </span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {links.map(({ href, label, icon: Icon }) => (
              <DropdownMenuItem
                key={href}
                render={<Link href={href} />}
                onClick={() => setOpen(false)}
                className="min-h-11 px-3"
              >
                <Icon
                  aria-hidden="true"
                  className="size-4"
                />
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              variant="destructive"
              disabled={signingOut}
              className="min-h-11 px-3"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
            >
              <LogOut
                aria-hidden="true"
                className="size-4"
              />
              {signingOut ? t("signingOut") : t("logout")}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </DirectionProvider>
  );
}
