"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useSafeSession, useSessionResolved } from "@/features/account/session-hooks";
import { IdentityGate } from "@/features/account/identity";
import { TaskDialog } from "@/components/shared/task-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { hasExplicitSearch } from "@/features/properties/preference-search";
import { PropertySearchPage } from "@/features/properties/search-page";
import { initialSearchMode, type SearchMode } from "./smart-search-state";

const SmartSearchWorkspace = dynamic(() =>
  import("./smart-search-workspace").then((module) => module.SmartSearchWorkspace),
);

export function PropertyDiscoveryExperience() {
  const t = useTranslations("PropertyDiscovery");
  const params = useSearchParams();
  const serialized = params.toString();
  const requestedMode = params.get("mode");
  const initialMode = initialSearchMode(
    requestedMode,
    hasExplicitSearch(new URLSearchParams(serialized)),
  );
  const [normalVisited, setNormalVisited] = useState(initialMode === "normal");
  const [smartVisited, setSmartVisited] = useState(initialMode === "smart");
  const [authOpen, setAuthOpen] = useState(false);
  const authPrompted = useRef(false);
  const session = useSafeSession();
  const sessionResolved = useSessionResolved();
  const mode = initialMode;

  useEffect(() => {
    if (mode === "smart" && sessionResolved && !session && !authPrompted.current) {
      authPrompted.current = true;
      setAuthOpen(true);
    }
  }, [mode, session, sessionResolved]);

  const selectMode = (next: SearchMode) => {
    const nextParams = new URLSearchParams(window.location.search);
    nextParams.set("mode", next);
    window.history.pushState(
      null,
      "",
      `${window.location.pathname}?${nextParams}${window.location.hash}`,
    );
    if (next === "normal") setNormalVisited(true);
    else {
      setSmartVisited(true);
      if (sessionResolved && !session) {
        authPrompted.current = true;
        setAuthOpen(true);
      }
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Tabs
        value={mode}
        onValueChange={(value) => {
          if (value === "normal" || value === "smart") selectMode(value);
        }}
        className="gap-8"
      >
        <div className="flex flex-col gap-5">
          <div>
            {mode === "normal" ? (
              <p className="font-heading text-display font-semibold">
                {t("experienceTitle")}
              </p>
            ) : (
              <h1 className="font-heading text-display font-semibold">
                {t("experienceTitle")}
              </h1>
            )}
            <p className="mt-2 max-w-2xl text-muted-foreground">
              {t("experienceDescription")}
            </p>
          </div>
          <TabsList
            aria-label={t("searchModes")}
            className="w-full sm:w-fit"
          >
            <TabsTrigger value="normal">{t("normalTitle")}</TabsTrigger>
            <TabsTrigger value="smart">{t("smartTitle")}</TabsTrigger>
          </TabsList>
        </div>

        {mode === null ? (
          <div className="grid gap-4 md:grid-cols-2">
            <SearchChoice
              title={t("normalTitle")}
              description={t("normalDescription")}
              action={t("normalStart")}
              icon={
                <Search
                  aria-hidden="true"
                  className="size-7"
                />
              }
              onClick={() => selectMode("normal")}
            />
            <SearchChoice
              title={t("smartTitle")}
              description={t("smartDescription")}
              action={t("smartTry")}
              icon={
                <Sparkles
                  aria-hidden="true"
                  className="size-7"
                />
              }
              onClick={() => selectMode("smart")}
              smart
            />
          </div>
        ) : null}

        {normalVisited ? (
          <TabsContent
            value="normal"
            keepMounted
          >
            <PropertySearchPage />
          </TabsContent>
        ) : null}
        {smartVisited ? (
          <TabsContent
            value="smart"
            keepMounted
          >
            {sessionResolved && session ? (
              <IdentityGate>
                <SmartSearchWorkspace key={session.userId} />
              </IdentityGate>
            ) : sessionResolved ? (
              <div className="rounded-3xl border border-border/60 bg-card p-6">
                <h2 className="font-heading text-section">{t("authTitle")}</h2>
                <p className="mt-2 text-muted-foreground">{t("authDescription")}</p>
                <Button
                  className="mt-5"
                  onClick={() => setAuthOpen(true)}
                >
                  {t("login")}
                </Button>
              </div>
            ) : (
              <p
                role="status"
                className="text-muted-foreground"
              >
                {t("checkingSession")}
              </p>
            )}
          </TabsContent>
        ) : null}
      </Tabs>

      <TaskDialog
        open={authOpen && !session}
        onOpenChange={setAuthOpen}
        title={t("authTitle")}
        description={t("authDescription")}
      >
        <div className="flex flex-wrap gap-3">
          <Button
            nativeButton={false}
            render={<Link href="/login" />}
          >
            {t("login")}
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/register" />}
          >
            {t("register")}
          </Button>
        </div>
      </TaskDialog>
    </div>
  );
}

function SearchChoice({
  title,
  description,
  action,
  icon,
  onClick,
  smart = false,
}: {
  title: string;
  description: string;
  action: string;
  icon: React.ReactNode;
  onClick: () => void;
  smart?: boolean;
}) {
  return (
    <article
      className={
        smart
          ? "flex min-h-72 flex-col rounded-3xl bg-primary p-6 text-primary-foreground shadow-card sm:p-8"
          : "flex min-h-72 flex-col rounded-3xl border border-border/60 bg-card p-6 shadow-card sm:p-8"
      }
    >
      <span className={smart ? "text-primary-foreground/80" : "text-primary"}>
        {icon}
      </span>
      <h2 className="mt-7 font-heading text-section font-semibold">{title}</h2>
      <p
        className={
          smart
            ? "mt-2 flex-1 text-primary-foreground/80"
            : "mt-2 flex-1 text-muted-foreground"
        }
      >
        {description}
      </p>
      <Button
        className="mt-6 self-start"
        variant={smart ? "secondary" : "default"}
        onClick={onClick}
      >
        {action}
      </Button>
    </article>
  );
}
