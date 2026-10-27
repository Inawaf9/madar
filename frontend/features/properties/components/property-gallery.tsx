"use client";
import Image from "next/image";
import { useCallback, useState, useSyncExternalStore } from "react";
import { useLocale } from "next-intl";
import { useReducedMotion } from "motion/react";
import { House, Images } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { safeUrl } from "@/lib/safe-url";

function GalleryFallback({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-secondary p-6 text-center text-sm text-muted-foreground"
    >
      <House
        aria-hidden="true"
        className="size-8"
      />
      <p>{message}</p>
    </div>
  );
}

function GalleryImage({
  src,
  title,
  first,
  ar,
}: {
  src: string;
  title: string;
  first: boolean;
  ar: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <div
      className="relative aspect-[4/3] overflow-hidden bg-secondary"
      aria-busy={!loaded && !failed}
    >
      {failed ? (
        <GalleryFallback
          message={ar ? "تعذّر تحميل هذه الصورة" : "This image could not be loaded"}
        />
      ) : (
        <>
          <Image
            src={src}
            alt=""
            aria-hidden="true"
            fill
            sizes="(max-width: 1023px) 100vw, 60vw"
            unoptimized
            draggable={false}
            className="pointer-events-none scale-110 object-cover opacity-30 blur-xl"
          />
          <Image
            src={src}
            alt={title}
            fill
            sizes="(max-width: 1023px) 100vw, 60vw"
            unoptimized
            draggable={false}
            preload={first}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={cn(
              "object-contain transition-opacity duration-200 motion-reduce:transition-none",
              loaded ? "opacity-100" : "opacity-0",
            )}
          />
          {!loaded ? (
            <div
              role="status"
              className="absolute inset-0"
            >
              <span className="sr-only">
                {ar ? "جارٍ تحميل الصورة" : "Loading image"}
              </span>
              <Skeleton className="size-full rounded-none" />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export function PropertyGallery({
  images: input,
  title,
}: {
  images: (string | null)[];
  title: string;
}) {
  const locale = useLocale();
  const ar = locale === "ar";
  const direction = ar ? "rtl" : "ltr";
  const reducedMotion = useReducedMotion();
  const images = Array.from(
    new Set(input.map(safeUrl).filter((src): src is string => !!src)),
  );
  const [api, setApi] = useState<CarouselApi>();
  const subscribe = useCallback(
    (notify: () => void) => {
      if (!api) return () => {};
      api.on("select", notify);
      api.on("reInit", notify);
      return () => {
        api.off("select", notify);
        api.off("reInit", notify);
      };
    },
    [api],
  );
  const snapshot = useSyncExternalStore(
    subscribe,
    () =>
      api
        ? `${api.selectedScrollSnap() + 1}:${api.scrollSnapList().length}`
        : `1:${images.length}`,
    () => `1:${images.length}`,
  );
  const [current, total] = snapshot.split(":").map(Number);
  const number = new Intl.NumberFormat(locale);
  const label = ar ? "صور العقار" : "Property photos";
  if (!images.length)
    return (
      <section
        aria-label={label}
        className="relative aspect-[4/3] min-w-0 overflow-hidden rounded-3xl border bg-secondary"
      >
        <GalleryFallback
          message={
            ar ? "لا تتوفر صور لهذا العقار" : "No photos are available for this property"
          }
        />
      </section>
    );
  return (
    <Carousel
      dir={direction}
      opts={{ direction, align: "start", loop: false, duration: reducedMotion ? 0 : 25 }}
      setApi={setApi}
      aria-label={label}
      tabIndex={0}
      className="min-w-0 overflow-hidden rounded-3xl border bg-secondary outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <CarouselContent className="ms-0">
        {images.map((src, i) => (
          <CarouselItem
            key={src}
            className="basis-full ps-0"
            aria-label={
              ar
                ? `الصورة ${number.format(i + 1)} من ${number.format(images.length)}`
                : `Photo ${number.format(i + 1)} of ${number.format(images.length)}`
            }
          >
            <GalleryImage
              src={src}
              title={title}
              first={i === 0}
              ar={ar}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      {images.length > 1 ? (
        <>
          <CarouselPrevious
            className="inset-y-auto start-2 top-1/2 my-0 size-9 -translate-y-1/2 rounded-full bg-card/95 shadow-sm sm:start-3"
            aria-label={ar ? "الصورة السابقة" : "Previous photo"}
          />
          <CarouselNext
            className="inset-y-auto end-2 top-1/2 my-0 size-9 -translate-y-1/2 rounded-full bg-card/95 shadow-sm sm:end-3"
            aria-label={ar ? "الصورة التالية" : "Next photo"}
          />
        </>
      ) : null}
      <div className="pointer-events-none absolute bottom-3 end-3 flex items-center gap-1.5 rounded-full border bg-card/90 px-2.5 py-1.5 text-xs text-card-foreground">
        <Images
          aria-hidden="true"
          className="size-3.5"
        />
        <span
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {number.format(current)} {ar ? "من" : "of"} {number.format(total)}
        </span>
      </div>
    </Carousel>
  );
}
