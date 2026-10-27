"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { House, LocateFixed, RotateCcw } from "lucide-react";
import {
  Map,
  Marker,
  Popup,
  NavigationControl,
  ScaleControl,
  LngLatBounds,
  getVersion,
  setWorkerUrl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Button } from "@/components/ui/button";
import { MapSkeleton } from "@/components/shared/page-skeleton";
import type { MapLocationSelection } from "./map-types";
import { validCoordinates } from "@/lib/maps/points";
import type { MapPoint } from "@/lib/maps/points";
import { poiIconPaths } from "@/lib/maps/poi";
import { categoryLabel } from "@/lib/maps/place-presentation";
import { propertyDistanceLabel } from "@/lib/maps/nearby-distance";
import { cn } from "@/lib/utils";

// Turbopack relocates the main module; its sibling-worker URL is no longer valid.
// Serve the exact installed version from public instead of inferring a chunk URL.
setWorkerUrl(`/maplibre/${getVersion()}/maplibre-gl-worker.mjs`);

const failureMessages = {
  worker: [
    "ما قدرنا نشغّل الخريطة. أعد تحميلها، وإذا استمر الخطأ حدّث الصفحة.",
    "The map could not start. Reload it, then refresh the page if the issue continues.",
  ],
  access: [
    "خدمة الخرائط رفضت الطلب. حاول مرة ثانية لاحقًا.",
    "The map service denied the request. Please try again later.",
  ],
  webgl: [
    "متصفحك ما قدر يعرض الخريطة. جرّب متصفحًا ثانيًا أو فعّل تسريع الرسوم.",
    "Your browser could not display the map. Try another browser or enable graphics acceleration.",
  ],
  style: [
    "ما قدرنا نحمّل الخريطة. تحقق من اتصالك وحاول مرة ثانية.",
    "The map could not load. Check your connection and try again.",
  ],
  timeout: [
    "تأخر تحميل الخريطة. حاول مرة ثانية، وتقدر تكمل باستخدام تفاصيل المواقع.",
    "The map took too long to load. Try again or continue using the location details.",
  ],
  unknown: [
    "ما قدرنا نعرض الخريطة. حاول مرة ثانية، وتقدر تكمل باستخدام تفاصيل المواقع.",
    "The map could not be displayed. Try again or continue using the location details.",
  ],
} as const;
type MapFailure = keyof typeof failureMessages;
function mapFailure(error: unknown): MapFailure {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  const status =
    typeof error === "object" && error !== null && "status" in error
      ? error.status
      : undefined;
  if (message.includes("worker")) return "worker";
  if (message.includes("webgl") || message.includes("web gl")) return "webgl";
  if (status === 401 || status === 403 || /\b(401|403)\b/.test(message)) return "access";
  if (message.includes("style.json")) return "style";
  return "unknown";
}

function fitPoints(map: Map, points: MapPoint[]) {
  if (!points.length) return;
  const bounds = new LngLatBounds();
  for (const point of points) bounds.extend([point.longitude!, point.latitude!]);
  if (points.length === 1) map.jumpTo({ center: bounds.getCenter(), zoom: 14 });
  else map.fitBounds(bounds, { padding: 64, maxZoom: 15, duration: 0 });
}

function markerButton(point: MapPoint) {
  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-label", point.title);
  button.setAttribute("aria-pressed", "false");
  button.title = point.title;
  button.className =
    "group relative grid cursor-pointer place-items-center border-2 border-card shadow-panel outline-none transition-shadow focus-visible:ring-4 focus-visible:ring-ring aria-pressed:ring-4 aria-pressed:ring-ring/50 motion-reduce:transition-none";
  button.classList.add(
    ...(point.kind === "service" ? "size-9 rounded-full" : "size-12 rounded-2xl").split(
      " ",
    ),
  );
  button.classList.add(
    ...(point.kind === "property"
      ? "bg-primary text-primary-foreground"
      : point.kind === "home"
        ? "bg-accent text-accent-foreground"
        : "bg-secondary text-secondary-foreground"
    ).split(" "),
  );
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  for (const [key, value] of Object.entries({
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "1.7",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "aria-hidden": "true",
  }))
    svg.setAttribute(key, value);
  svg.classList.add(point.kind === "service" ? "size-4" : "size-6");
  const paths =
    point.kind === "service" && point.category
      ? poiIconPaths[point.category]
      : point.kind === "destination"
        ? [
            "M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z",
            "M9 10a3 3 0 1 0 6 0a3 3 0 1 0-6 0",
          ]
        : ["m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z", "M9 21v-8h6v8"];
  for (const d of paths) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    svg.append(path);
  }
  button.append(svg);
  const tip = document.createElement("span");
  tip.className =
    "absolute -bottom-1.5 start-1/2 size-2.5 -translate-x-1/2 rotate-45 border-b-2 border-e-2 border-card bg-inherit rtl:translate-x-1/2";
  tip.setAttribute("aria-hidden", "true");
  button.append(tip);
  return button;
}

type Props = {
  apiKey: string;
  pointsJson: string;
  dark: boolean;
  locale: string;
  label: string;
  selectedId?: string | null;
  focusTick?: number;
  onSelectPoint?: (id: string | null) => void;
  locationSelection?: MapLocationSelection;
  className?: string;
};
export default function MapLibreMap(props: Props) {
  const [attempt, setAttempt] = useState(0);
  return (
    <MapCanvas
      key={attempt}
      {...props}
      retry={() => setAttempt((value) => value + 1)}
    />
  );
}
function MapCanvas({
  apiKey,
  pointsJson,
  dark,
  locale,
  label,
  retry,
  selectedId,
  focusTick,
  onSelectPoint,
  locationSelection,
  className,
}: Props & { retry: () => void }) {
  const container = useRef<HTMLDivElement>(null);
  const instance = useRef<Map | null>(null);
  const initialPoints = useRef(pointsJson);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState<MapFailure | null>(null);
  const [resourceWarning, setResourceWarning] = useState(false);
  const locationSelectionRef = useRef(locationSelection);
  useEffect(() => {
    locationSelectionRef.current = locationSelection;
  }, [locationSelection]);
  const onSelectRef = useRef(onSelectPoint);
  const selectedIdRef = useRef(selectedId);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);
  const activatePoint = useRef<(id: string | null) => void>(() => {});
  useEffect(() => {
    onSelectRef.current = onSelectPoint;
  }, [onSelectPoint]);
  useEffect(() => {
    if (ready && selectedId !== undefined) activatePoint.current(selectedId);
  }, [ready, selectedId, focusTick]);
  useEffect(() => {
    if (!container.current) return;
    const element = container.current;
    const points = JSON.parse(initialPoints.current) as MapPoint[];
    const cameraPoint = locationSelectionRef.current?.value || points[0];
    let active = true;
    let loaded = false;
    let map: Map | undefined;
    let observer: ResizeObserver | undefined;
    const fail = (reason: MapFailure) => {
      if (active) setFailed(reason);
    };
    const timeout = window.setTimeout(() => {
      if (!loaded) fail("timeout");
    }, 45_000);
    // Wait for the responsive container to have dimensions before starting WebGL.
    const frame = requestAnimationFrame(() => {
      try {
        map = new Map({
          container: element,
          style: `https://api.maptiler.com/maps/${dark ? "streets-v4-dark" : "streets-v4"}/style.json?key=${encodeURIComponent(apiKey)}`,
          // A country-level camera is not a selected/saved location.
          center: cameraPoint
            ? [cameraPoint.longitude!, cameraPoint.latitude!]
            : [45, 24],
          zoom: cameraPoint ? 14 : 5,
          cooperativeGestures: true,
          renderWorldCopies: false,
          attributionControl: {
            compact: false,
            customAttribution:
              '<a href="https://www.maptiler.com/copyright/" target="_blank" rel="noopener noreferrer">© MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>' +
              (points.some((p) => p.provenance === "geoapify")
                ? ' · <a href="https://www.geoapify.com/" target="_blank" rel="noopener noreferrer">Powered by Geoapify</a>'
                : ""),
          },
          locale:
            locale === "ar"
              ? {
                  "NavigationControl.ZoomIn": "تكبير",
                  "NavigationControl.ZoomOut": "تصغير",
                  "NavigationControl.ResetBearing": "اتجاه الشمال",
                  "AttributionControl.ToggleAttribution": "إسناد الخريطة",
                  "Map.Title": "خريطة تفاعلية",
                  "Popup.Close": "إغلاق التفاصيل",
                  "CooperativeGesturesHandler.TouchPan": "استخدم إصبعين لتحريك الخريطة",
                  "CooperativeGesturesHandler.WindowsHelpText":
                    "اضغط Ctrl أثناء التمرير لتكبير الخريطة",
                  "CooperativeGesturesHandler.MacHelpText":
                    "اضغط ⌘ أثناء التمرير لتكبير الخريطة",
                }
              : undefined,
        });
        instance.current = map;
        map.on("click", (event) => {
          const picker = locationSelectionRef.current;
          const longitude = event.lngLat.wrap().lng;
          const latitude = event.lngLat.lat;
          if (picker && validCoordinates(latitude, longitude))
            picker.onChange({ latitude, longitude });
        });
        map.addControl(new NavigationControl(), "top-left");
        map.addControl(new ScaleControl({ unit: "metric" }), "bottom-left");
        map.on("error", (event) => {
          if (!active) return;
          const reason = mapFailure(event.error);
          if (
            reason === "worker" ||
            reason === "webgl" ||
            (!loaded && (reason === "style" || reason === "access"))
          )
            fail(reason);
          else setResourceWarning(true);
        });
        map.getCanvas().addEventListener("webglcontextlost", () => fail("webgl"));
        map.on("load", () => {
          if (!active || !map) return;
          loaded = true;
          clearTimeout(timeout);
          // Only name-based labels are localized; route/reference labels retain
          // the provider's style. MapLibre 6 shapes Arabic natively, without a plugin.
          try {
            for (const layer of map.getStyle().layers) {
              if (
                layer.type !== "symbol" ||
                !layer.layout?.["text-field"] ||
                !JSON.stringify(layer.layout["text-field"]).includes('"name')
              )
                continue;
              map.setLayoutProperty(layer.id, "text-field", [
                "coalesce",
                ["get", `name:${locale === "ar" ? "ar" : "en"}`],
                ["get", "name"],
                ["get", "name:latin"],
              ]);
            }
          } catch {
            setResourceWarning(true);
          }
          fitPoints(map, points);
          // A late successful load must recover from a previous timeout/error.
          setFailed(null);
          setReady(true);
        });
        observer = new ResizeObserver(() => {
          if (active) map?.resize();
        });
        observer.observe(element);
      } catch (error) {
        fail(mapFailure(error));
      }
    });
    return () => {
      active = false;
      clearTimeout(timeout);
      cancelAnimationFrame(frame);
      observer?.disconnect();
      map?.remove();
      instance.current = null;
    };
  }, [apiKey, dark, locale]);
  useEffect(() => {
    const map = instance.current;
    if (!ready || !map) return;
    const points = JSON.parse(pointsJson) as MapPoint[];
    let selected: HTMLButtonElement | undefined;
    let popup: Popup | undefined;
    const markers: Marker[] = [];
    if (!locationSelectionRef.current) fitPoints(map, points);
    const openers: Record<string, () => void> = {};
    for (const point of points) {
      const button = markerButton(point);
      button.style.zIndex = point.kind === "property" ? "3" : "2";
      const open = (toggle: boolean) => {
        if (!map) return;
        const wasSelected = selected === button && !!popup?.isOpen();
        if (wasSelected && !toggle) return;
        popup?.remove();
        selected?.setAttribute("aria-pressed", "false");
        if (wasSelected) {
          selected = undefined;
          onSelectRef.current?.(null);
          return;
        }
        selected = button;
        selected.setAttribute("aria-pressed", "true");
        const content = document.createElement("div");
        content.dir = "auto";
        content.className =
          "flex max-w-64 flex-col gap-2 break-words bg-card px-7 py-2 font-sans text-card-foreground";
        const heading = document.createElement("strong");
        heading.textContent = point.title;
        content.append(heading);
        if (point.description) {
          const description = document.createElement("p");
          description.className = "text-sm text-muted-foreground";
          description.textContent = point.description;
          content.append(description);
        }
        if (point.kind === "service") {
          const information = document.createElement("p");
          information.className = "text-xs leading-6 text-muted-foreground";
          information.textContent = `${categoryLabel(point.category, locale)} · ${propertyDistanceLabel(point.distanceMeters ?? null, locale)}${locale === "ar" ? "، بخط مستقيم" : ", straight-line distance"}`;
          content.append(information);
          if (point.details) {
            const details = document.createElement("details");
            const summary = document.createElement("summary");
            summary.textContent = locale === "ar" ? "تفاصيل المكان" : "Place details";
            summary.className = "cursor-pointer text-sm text-primary";
            const address = document.createElement("p");
            address.textContent = point.details;
            address.className = "mt-2 text-xs leading-6";
            details.append(summary, address);
            content.append(details);
          }
        }
        const opened = new Popup({
          offset: 32,
          maxWidth: "280px",
          closeButton: true,
          focusAfterOpen: true,
        })
          .setLngLat([point.longitude!, point.latitude!])
          .setDOMContent(content)
          .addTo(map);
        popup = opened;
        opened.on("close", () => {
          button.setAttribute("aria-pressed", "false");
          if (popup === opened) {
            popup = undefined;
            selected = undefined;
            onSelectRef.current?.(null);
          }
        });
        onSelectRef.current?.(point.id);
        map.easeTo({
          center: [point.longitude!, point.latitude!],
          duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? 0
            : 400,
        });
        const property = points.find((p) => p.kind === "property");
        if (point.kind === "service" && property) fitPoints(map, [property, point]);
      };
      openers[point.id] = () => open(false);
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        open(true);
      });
      markers.push(
        new Marker({ element: button, anchor: "bottom", offset: [0, -6] })
          .setLngLat([point.longitude!, point.latitude!])
          .addTo(map),
      );
    }
    activatePoint.current = (id) => {
      if (id) {
        const point = points.find((candidate) => candidate.id === id);
        if (point)
          map.easeTo({
            center: [point.longitude!, point.latitude!],
            duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
              ? 0
              : 400,
          });
        openers[id]?.();
      } else {
        popup?.remove();
        selected?.setAttribute("aria-pressed", "false");
        selected = undefined;
      }
    };

    if (selectedIdRef.current) activatePoint.current(selectedIdRef.current);
    return () => {
      activatePoint.current = () => {};
      popup?.remove();
      for (const marker of markers) marker.remove();
    };
  }, [ready, pointsJson, locale]);
  const pickedLatitude = locationSelection?.value?.latitude;
  const pickedLongitude = locationSelection?.value?.longitude;
  useEffect(() => {
    const map = instance.current;
    if (
      !ready ||
      !map ||
      pickedLatitude == null ||
      pickedLongitude == null ||
      !validCoordinates(pickedLatitude, pickedLongitude)
    )
      return;
    if (
      map.getZoom() < 12 ||
      !map.getBounds().contains([pickedLongitude, pickedLatitude])
    )
      map.jumpTo({ center: [pickedLongitude, pickedLatitude], zoom: 14 });
    const marker = new Marker({ draggable: true, color: "var(--primary)" })
      .setLngLat([pickedLongitude, pickedLatitude])
      .addTo(map);
    marker
      .getElement()
      .setAttribute(
        "aria-label",
        locale === "ar"
          ? "الموقع المختار؛ اسحب العلامة لتعديله"
          : "Selected location; drag to adjust",
      );
    marker.on("dragend", () => {
      const point = marker.getLngLat().wrap();
      if (validCoordinates(point.lat, point.lng))
        locationSelectionRef.current?.onChange({
          latitude: point.lat,
          longitude: point.lng,
        });
    });
    return () => {
      marker.remove();
    };
  }, [ready, pickedLatitude, pickedLongitude, locale]);
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <section
        dir="ltr"
        aria-label={label}
        className={cn(
          "relative w-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-panel [&_.maplibregl-popup]:z-30 [&_.maplibregl-popup-content]:rounded-2xl [&_.maplibregl-popup-content]:bg-card [&_.maplibregl-popup-content]:text-card-foreground [&_.maplibregl-popup-close-button]:size-9 [&_.maplibregl-popup-close-button]:text-lg",
          className || "h-80 sm:h-96",
        )}
      >
        <div
          ref={container}
          dir="ltr"
          aria-hidden={!ready || !!failed}
          inert={!ready || !!failed}
          className="size-full"
        />
        {!ready && !failed ? (
          <div className="absolute inset-0">
            <MapSkeleton />
          </div>
        ) : null}
        {failed ? (
          <div
            role="alert"
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-card p-6 text-center"
          >
            <p className="text-sm leading-7">
              {failureMessages[failed][locale === "ar" ? 0 : 1]}
            </p>
            <Button
              variant="outline"
              onClick={retry}
            >
              <RotateCcw data-icon="inline-start" />
              {locale === "ar" ? "أعد تحميل الخريطة" : "Reload map"}
            </Button>
          </div>
        ) : null}
        {ready && !failed ? (
          <>
            {!locationSelection ? (
              <Button
                variant="outline"
                size="icon"
                className="absolute end-3 top-3 bg-card"
                aria-label={locale === "ar" ? "عرض جميع المواقع" : "Show all locations"}
                title={locale === "ar" ? "عرض جميع المواقع" : "Show all locations"}
                onClick={() => {
                  if (instance.current)
                    fitPoints(instance.current, JSON.parse(pointsJson) as MapPoint[]);
                }}
              >
                <LocateFixed />
              </Button>
            ) : null}
            {!locationSelection &&
            (JSON.parse(pointsJson) as MapPoint[]).some(
              (point) => point.kind === "home",
            ) ? (
              <Button
                variant="outline"
                size="icon"
                className="absolute end-3 top-16 bg-card"
                aria-label={locale === "ar" ? "العودة إلى المنزل" : "Center on home"}
                onClick={() => {
                  const home = (JSON.parse(pointsJson) as MapPoint[]).find(
                    (point) => point.kind === "home",
                  );
                  if (instance.current && home) fitPoints(instance.current, [home]);
                }}
              >
                <House />
              </Button>
            ) : null}
            {locationSelection ? (
              <Button
                type="button"
                variant="outline"
                className="absolute end-3 top-3 max-w-[calc(100%-4rem)] bg-card"
                onClick={() => {
                  const point = instance.current?.getCenter().wrap();
                  if (point && validCoordinates(point.lat, point.lng))
                    locationSelectionRef.current?.onChange({
                      latitude: point.lat,
                      longitude: point.lng,
                    });
                }}
              >
                {locale === "ar" ? "اختيار وسط الخريطة" : "Choose map center"}
              </Button>
            ) : null}
            {JSON.parse(pointsJson).some((p: MapPoint) => p.kind === "service") &&
            !(JSON.parse(pointsJson) as MapPoint[]).some((p) => p.kind === "home") ? (
              <Button
                variant="outline"
                size="icon"
                className="absolute end-3 top-16 bg-card"
                aria-label={locale === "ar" ? "العودة إلى العقار" : "Return to property"}
                title={locale === "ar" ? "العودة إلى العقار" : "Return to property"}
                onClick={() => {
                  const property = (JSON.parse(pointsJson) as MapPoint[]).find(
                    (p) => p.kind === "property",
                  );
                  if (instance.current && property)
                    fitPoints(instance.current, [property]);
                }}
              >
                <House />
              </Button>
            ) : null}
            <a
              href="https://www.maptiler.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-9 start-2 rounded bg-card/95 p-1"
              aria-label="MapTiler"
            >
              <Image
                src="/attribution/maptiler.svg"
                width={67}
                height={20}
                alt="MapTiler"
              />
            </a>
          </>
        ) : null}
      </section>
      {resourceWarning && ready && !failed ? (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4"
        >
          <p className="text-sm text-muted-foreground">
            {locale === "ar"
              ? "بعض تفاصيل الخريطة ما تحمّلت. تقدر تستخدم المواقع المتاحة."
              : "Some map details did not load. You can still use the available locations."}
          </p>
          <Button
            variant="outline"
            onClick={retry}
          >
            {locale === "ar" ? "أعد تحميل التفاصيل" : "Reload details"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
