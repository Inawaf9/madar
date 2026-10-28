"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { useLocale } from "next-intl";
import { House } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { safeUrl } from "@/lib/safe-url";
import { cn } from "@/lib/utils";

type Props = {
  src: string | null;
  title: string;
  loading?: boolean;
  priority?: boolean;
  sizes?: string;
  fit?: "cover" | "contain";
  aspect?: "listing" | "gallery" | "wide" | "fill";
  fallback?: ReactNode;
};
export function PropertyMedia(props: Props) {
  return (
    <Media
      key={props.src || "missing"}
      {...props}
    />
  );
}
function Media({
  src,
  title,
  loading = false,
  priority = false,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  fit = "cover",
  aspect = "listing",
  fallback,
}: Props) {
  const ar = useLocale() === "ar";
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const image = safeUrl(src);
  return (
    <div
      className={cn(
        "relative isolate min-w-0 overflow-hidden bg-secondary",
        aspect === "wide"
          ? "aspect-video"
          : aspect === "listing"
            ? "aspect-[16/10]"
            : aspect === "gallery"
              ? "aspect-[4/3]"
              : "size-full",
      )}
    >
      {loading && !image ? (
        <Skeleton className="absolute inset-0 size-full rounded-none" />
      ) : image && !failed ? (
        <>
          {!loaded ? (
            <Skeleton className="absolute inset-0 size-full rounded-none" />
          ) : null}
          <Image
            src={image}
            alt={title}
            fill
            sizes={sizes}
            unoptimized
            preload={priority}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={cn(
              "transition-transform duration-300 motion-safe:group-hover/home:scale-[1.025] motion-reduce:transition-none",
              fit === "contain" ? "object-contain" : "object-cover",
            )}
          />
        </>
      ) : (
        fallback || (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-muted-foreground">
            <House
              aria-hidden="true"
              className="size-7 stroke-1"
            />
            <span
              lang="en"
              translate="no"
              className="text-caption font-medium"
            >
              MADAR
            </span>
            <span className="text-caption">
              {ar ? "لا تتوفر صورة للإعلان" : "No listing photo available"}
            </span>
          </div>
        )
      )}
    </div>
  );
}
