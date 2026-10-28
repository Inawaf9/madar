"use client";
import { useState } from "react";
import { LocalSelectionResult } from "./local-selection-result";
import { useLocale } from "next-intl";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { TaskDialog } from "@/components/shared/task-dialog";
import { MadarMap } from "@/components/maps/madar-map";
import { MapNearbyServices } from "@/features/properties/map-nearby-services";
import { PropertyFacts } from "@/features/properties/property-facts";
import { PropertyPrice } from "@/features/properties/property-card-view";
import { PropertyMedia } from "@/features/properties/property-media";
import { useProperty } from "@/features/properties/use-property";
import { propertyHref } from "@/features/properties/format";
import { PropertyGridSkeleton } from "@/features/properties/skeletons";
import { ErrorState } from "@/components/shared/error-state";
import { poiCategorySchema } from "@/lib/maps/poi";
import { validCoordinates } from "@/lib/maps/points";
import { assistantActionRegistry } from "../assistant-action-registry";
import { NearbyServicePreview } from "./nearby-service-preview";
import { useAssistant } from "../assistant-context";
import {
  placeOptions,
  propertyOptions,
  type AssistantActionResult,
  type AssistantPropertyRef,
} from "../assistant-interaction-state";
import { actionLabel } from "../action-labels";

export function AssistantToolResult(props: { result: AssistantActionResult }) {
  return props.result.kind === "local" ? (
    <LocalSelectionResult result={props.result} />
  ) : (
    <InteractiveToolResult {...props} />
  );
}
function InteractiveToolResult({ result }: { result: AssistantActionResult }) {
  const locale = useLocale();
  const ar = locale === "ar";
  const { state, accountData, send, setOpen } = useAssistant();
  const [map, setMap] = useState(false);
  const [mapSelection, setMapSelection] = useState<string | null>(null);
  const [preview, setPreview] = useState<AssistantPropertyRef | null>(null);
  const [service, setService] = useState<string | null>(
    (result.data?.categories as string[] | undefined)?.[0] || null,
  );
  const properties = propertyOptions(accountData.account, state.selections, ar);
  const places = placeOptions(accountData.account);
  const data = result.data || {};
  const chosenProperties = properties.filter((property) =>
    (result.kind === "services" && Array.isArray(data.propertyIds)
      ? data.propertyIds
      : Array.isArray(data.ids)
        ? data.ids
        : state.selections.selectedPropertyIds
    ).includes(property.id),
  );
  const selectedProperty = chosenProperties.find(
    (property) =>
      property.listing &&
      validCoordinates(property.listing.latitude, property.listing.longitude),
  )?.listing;
  const anchor =
    result.kind === "services" && selectedProperty
      ? selectedProperty
      : state.selections.location ||
        state.selections.home ||
        places.find((place) => state.selections.destinationIds.includes(place.id));
  const point =
    anchor && validCoordinates(anchor.latitude, anchor.longitude)
      ? {
          id: "assistant-selection",
          title: ar ? "الموقع المختار" : "Selected location",
          latitude: anchor.latitude,
          longitude: anchor.longitude,
          provenance: "user" as const,
          kind: "destination" as const,
        }
      : null;
  let content: React.ReactNode = null;
  if (result.kind === "comparison")
    content = (
      <>
        <div className="max-w-full overflow-x-auto rounded-xl border border-border/50">
          <table className="w-full text-xs [&_td]:p-2 [&_th]:p-2 [&_th]:text-start">
            <thead>
              <tr>
                <th>{ar ? "البيت" : "Home"}</th>
                <th>SAR</th>
                <th>{ar ? "غرف" : "Beds"}</th>
                <th>m²</th>
              </tr>
            </thead>
            <tbody>
              {chosenProperties.map((property) => (
                <tr key={property.id}>
                  <td>{property.title}</td>
                  <td>
                    <PropertyPrice
                      price={property.listing?.price ?? null}
                      pricePeriod={property.listing?.pricePeriod ?? null}
                    />
                  </td>
                  <td>
                    {property.listing?.bedrooms ?? (ar ? "غير متاح" : "Unavailable")}
                  </td>
                  <td>
                    {property.listing?.areaSqm ?? (ar ? "غير متاح" : "Unavailable")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-caption text-muted-foreground">
          {ar
            ? "نعرض المواصفات وفترة السعر المتاحة فقط. قد لا يظهر سعر للمراجع المحفوظة."
            : "Only available specifications and price periods are shown. Saved references may not include a price."}
        </p>
      </>
    );
  else if (result.kind === "services")
    content = (
      <>
        <p className="text-xs text-muted-foreground">
          {ar
            ? "معاينة اختيار الخدمات؛ لا أماكن أو مسافات وهمية."
            : "Service selection preview; no fictional places or distances."}
        </p>
        <div className="flex flex-wrap gap-1">
          {((data.categories as string[]) || []).map((category) => (
            <Button
              key={category}
              size="sm"
              variant={service === category ? "secondary" : "outline"}
              aria-pressed={service === category}
              onClick={() => {
                setService(category);
                setMapSelection(null);
              }}
            >
              {actionLabel(category, ar)}
            </Button>
          ))}
        </div>
        {service ? (
          <p
            role="status"
            className="text-xs"
          >
            {actionLabel(service, ar)} ·{" "}
            {ar
              ? "الفئة المختارة للمعاينة؛ بيانات الأماكن في الخريطة الحية فقط."
              : "Selected preview category; actual places are available in the live map only."}
          </p>
        ) : null}
        {point && poiCategorySchema.safeParse(service).success ? (
          <NearbyServicePreview
            key={`${point.latitude}:${point.longitude}:${service}`}
            latitude={point.latitude!}
            longitude={point.longitude!}
            category={poiCategorySchema.parse(service)}
            onView={(id) => {
              setMapSelection(id || null);
              setMap(true);
            }}
          />
        ) : null}
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            point
              ? setMap(true)
              : send(
                  { type: "open-tool", tool: "location" },
                  ar ? "تحديد موقع الخدمات" : "Choose services location",
                )
          }
        >
          {point
            ? ar
              ? "فتح خدمات الخريطة الفعلية"
              : "Open actual map services"
            : ar
              ? "حدد موقعًا أولًا"
              : "Choose a location first"}
        </Button>
        <p className="text-caption text-muted-foreground">
          {ar
            ? "الخريطة الفعلية تستخدم نطاق التكامل الحالي 2 كم؛ مسافاتها بخط مستقيم، لا زمن سفر."
            : "The actual map uses its existing 2 km radius; distances are straight-line, not travel times."}
        </p>
      </>
    );
  else if (
    result.kind === "navigation" &&
    typeof data.route === "string" &&
    assistantActionRegistry.navigation.schema.safeParse(data).success
  )
    content = (
      <div className="flex flex-wrap items-center gap-2">
        <Button
          nativeButton={false}
          render={
            <Link
              href={data.route}
              onNavigate={() => setOpen(false)}
            />
          }
          variant="outline"
          size="sm"
        >
          {actionLabel(data.route, ar)}
        </Button>
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
    );
  return (
    <div className="flex min-w-0 max-w-full flex-col gap-2">
      {content}
      {chosenProperties.length ? (
        <div className="flex flex-col gap-1">
          {chosenProperties.map((property) => (
            <div
              key={property.id}
              className="flex min-w-0 flex-wrap items-center gap-1"
            >
              <span className="min-w-0 flex-1 text-xs wrap-break-word">
                {property.title}
              </span>
              {property.source && property.externalId ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPreview(property)}
                >
                  {ar ? "معاينة حقيقية" : "Actual preview"}
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      <TaskDialog
        open={map}
        onOpenChange={setMap}
        title={ar ? "خريطة الخدمات الفعلية" : "Actual service map"}
        description={
          ar
            ? "بيانات المصدر الحالي، وليست عينات التجربة."
            : "Existing provider data, not demo fixtures."
        }
      >
        {point && map ? (
          result.kind === "services" ? (
            <MapNearbyServices
              key={service || "none"}
              property={point}
              initialSelectedId={mapSelection}
              initialCategory={
                poiCategorySchema.safeParse(service).success
                  ? poiCategorySchema.parse(service)
                  : undefined
              }
            />
          ) : (
            <MadarMap points={[point]} />
          )
        ) : null}
      </TaskDialog>
      <TaskDialog
        open={preview !== null}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
        title={preview?.title || (ar ? "معاينة البيت" : "Home preview")}
        description={
          ar
            ? "بيانات إعلان فعلية عند توفرها، دون تعديل حسابك."
            : "Actual listing data when available, with no account changes."
        }
      >
        {preview?.source && preview.externalId ? (
          <ActualPreview
            source={preview.source}
            externalId={preview.externalId}
          />
        ) : null}
      </TaskDialog>
    </div>
  );
}
function ActualPreview({ source, externalId }: { source: string; externalId: string }) {
  const locale = useLocale();
  const ar = locale === "ar";
  const { setOpen, send, busy } = useAssistant();
  const query = useProperty(source, externalId);
  if (query.isPending) return <PropertyGridSkeleton count={1} />;
  if (query.isError && !query.data)
    return (
      <ErrorState
        error={query.error}
        retry={() => void query.refetch()}
      />
    );
  const listing = query.data;
  return (
    <div className="flex flex-col gap-3">
      <PropertyMedia
        aspect="gallery"
        src={listing.image || listing.images?.[0] || null}
        title={listing.title || (ar ? "البيت" : "Home")}
      />
      <PropertyPrice
        price={listing.price}
        pricePeriod={listing.pricePeriod}
      />
      <p className="text-xs text-muted-foreground">
        {[listing.cityName || listing.city, listing.neighborhood]
          .filter(Boolean)
          .join(" · ")}
      </p>
      <PropertyFacts
        property={listing}
        locale={locale}
      />
      {validCoordinates(listing.latitude, listing.longitude) ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() =>
            send(
              {
                type: "open-tool",
                tool: "location",
                initial: { latitude: listing.latitude, longitude: listing.longitude },
              },
              ar ? "موقع بيت مؤقت" : "Temporary listing location",
            )
          }
        >
          {ar ? "استخدام موقع البيت مؤقتًا" : "Use home location temporarily"}
        </Button>
      ) : null}
      <Button
        size="sm"
        variant="ghost"
        disabled={busy}
        onClick={() =>
          send(
            { type: "open-tool", tool: "services" },
            ar ? "خدمات حول موقع مختار" : "Services around a selected point",
          )
        }
      >
        {ar ? "الخدمات" : "Services"}
      </Button>
      {listing.description ? (
        <p className="line-clamp-3 text-xs leading-6">{listing.description}</p>
      ) : null}
      <Button
        nativeButton={false}
        render={
          <Link
            href={propertyHref(listing)}
            onNavigate={() => setOpen(false)}
          />
        }
      >
        {ar ? "التفاصيل الكاملة" : "Full details"}
      </Button>
    </div>
  );
}
