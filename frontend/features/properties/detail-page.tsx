"use client";
import { DisplayHeading } from "@/components/typography/display-heading";
import { useLocale } from "next-intl";
import { apiLanguage } from "@/lib/api/config";
import { useQuery } from "@tanstack/react-query";
import { useProperty } from "./use-property";
import { discovery } from "@/lib/api/discovery";
import { ErrorState } from "@/components/shared/error-state";
import { DetailSkeleton, PropertyGridSkeleton } from "./skeletons";
import { QueryFeedback } from "@/components/shared/query-feedback";
import { PropertyCard } from "./property-card";
import { PropertyGallery } from "./components/property-gallery";
import { PropertyInfoCard } from "./components/property-info-card";
import { MapPin } from "lucide-react";
import { PropertyLocationExperience } from "@/features/properties/components/property-location-experience";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PropertyBackButton } from "./components/property-back-button";

export function PropertyDetailPage({
  source,
  externalId,
}: {
  source: string;
  externalId: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PropertyBackButton key={`${source}:${externalId}`} />
      <PropertyDetailContent
        source={source}
        externalId={externalId}
      />
    </div>
  );
}

function PropertyDetailContent({
  source,
  externalId,
}: {
  source: string;
  externalId: string;
}) {
  const language = apiLanguage(useLocale());
  const query = useProperty(source, externalId);
  const [showSimilar, setShowSimilar] = useState(false);
  const similar = useQuery({
    queryKey: ["similar", source, externalId, language],
    queryFn: ({ signal }) => discovery.similar(source, externalId, signal, language),
    enabled: showSimilar && query.isSuccess,
    retry: false,
  });
  if (!source || !externalId || ["null", "undefined"].includes(externalId))
    return <p>معرّف الإعلان غير متاح؛ يبقى المرجع المحفوظ قابلًا للإدارة.</p>;
  if (query.isPending) return <DetailSkeleton />;
  if (query.isError && !query.data)
    return (
      <ErrorState
        error={query.error}
        retry={() => void query.refetch()}
        retryDisabled={query.isFetching}
      />
    );
  const p = query.data;
  const title = p.title || "تفاصيل البيت";
  return (
    <div className="flex flex-col gap-8">
      <QueryFeedback query={query} />
      <header className="flex min-w-0 flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          تفاصيل الإعلان · <bdi>{p.sourceName || p.source}</bdi>
        </p>
        <DisplayHeading
          dir="auto"
          className="text-start"
        >
          {title}
        </DisplayHeading>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin
            aria-hidden="true"
            className="size-4 shrink-0"
          />
          <bdi>
            {[p.cityName || p.city, p.neighborhood].filter(Boolean).join(" · ") ||
              "الموقع غير متاح من المصدر"}
          </bdi>
        </p>
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1fr)]">
        <div className="order-2 min-w-0 lg:order-1">
          <PropertyInfoCard property={p} />
        </div>
        <div className="order-1 min-w-0 lg:order-2">
          <PropertyGallery
            key={`${source}:${externalId}`}
            title={title}
            images={[p.image, ...(p.images || [])]}
          />
        </div>
      </div>
      <PropertyLocationExperience
        key={`${source}:${externalId}`}
        propertyReference={{ source, externalId }}
        point={{
          id: `${source}:${externalId}`,
          title,
          latitude: p.latitude,
          longitude: p.longitude,
          provenance: "listing",
          kind: "home",
        }}
      />
      <p className="text-xs leading-6 text-muted-foreground">
        الخيارات المشابهة تظهر بعدد محدود، وتراعي السعر والغرف. وإذا توفرت إحداثيات البيت،
        نستخدمها لضبط النتائج. بنطاق 5 كم بخط مستقيم، وإلا تكون على مستوى المدينة.
      </p>
      <Button
        variant="outline"
        onClick={() => setShowSimilar((v) => !v)}
      >
        {showSimilar ? "إخفاء الخيارات المشابهة" : "خيارات مشابهة"}
      </Button>
      {showSimilar ? (
        <>
          <QueryFeedback query={similar} />
          {similar.isPending ? (
            <PropertyGridSkeleton count={3} />
          ) : similar.isError && !similar.data?.length ? (
            <ErrorState
              error={similar.error}
              retry={() => void similar.refetch()}
              retryDisabled={similar.isFetching}
            />
          ) : similar.data?.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {similar.data.map((item, i) => (
                <PropertyCard
                  key={`${item.source}:${item.externalId || i}`}
                  property={item}
                />
              ))}
            </div>
          ) : (
            <p>لا توجد خيارات مشابهة لدى المزوّد.</p>
          )}
        </>
      ) : null}
    </div>
  );
}
