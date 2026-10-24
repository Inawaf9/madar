"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { serializeQuery } from "@/lib/api/query";
import { ArrowUpLeft, Link2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { PropertySearchForm, type SearchCriteria } from "./property-search-form";
import { SectionHeading } from "./section-heading";

export function PropertyDiscoverySection() {
  const t = useTranslations("PropertyDiscovery");
  const product = useTranslations("Workspace");
  const [criteria, setCriteria] = useState<SearchCriteria>({ city: "", purpose: "rent", q: "", maxPrice: "any", type: "all" });
  const router = useRouter();
  const update = (next: SearchCriteria) => {
    setCriteria(next.purpose !== criteria.purpose ? { ...next, maxPrice: "any" } : next);

  };

  return (
    <section id="discover" className="scroll-mt-24 bg-background py-14 sm:py-18 lg:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
        <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-5">
            <PropertySearchForm criteria={criteria} onChange={update} onSearch={() => router.push(`/properties?${serializeQuery({ ...criteria, maxPrice: criteria.maxPrice === "any" ? undefined : criteria.maxPrice })}`)} />

            <Button nativeButton={false} render={<Link href="/properties" />} variant="outline" size="lg" className="self-start">
              {product("organizeProperties")}<ArrowUpLeft data-icon="inline-end" className="rtl:-scale-x-100" />
            </Button>
          </div>
          <Card>
            <CardHeader>
              <span className="mb-3 grid size-11 place-items-center rounded-2xl bg-accent/15 text-accent-ink"><Link2 aria-hidden="true" className="size-5" /></span>
              <CardTitle><h3 className="text-xl font-bold">{t("referenceTitle")}</h3></CardTitle>
              <CardDescription className="leading-7">{t("referenceDescription")}</CardDescription>
            </CardHeader>
            <CardContent><p className="text-sm leading-7 text-muted-foreground">{product("referenceHint")}</p></CardContent>
            <CardFooter><Button nativeButton={false} render={<Link href="/saved" />} size="lg" className="w-full">{product("addProperty")}<ArrowUpLeft data-icon="inline-end" className="rtl:-scale-x-100" /></Button></CardFooter>
          </Card>
        </div>
      </div>
    </section>
  );
}
