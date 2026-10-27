"use client";
import { useHydrated } from "@/hooks/use-hydrated";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { MadarLogo } from "./madar-logo";

export type MadarLoaderProps = {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "inline" | "section" | "fullscreen";
  label?: string;
  /** Use inside an existing loading status to avoid a second announcement. */
  decorative?: boolean;
  className?: string;
};
const sizes = { xs: "w-6", sm: "w-10", md: "w-16", lg: "w-28", xl: "w-40" };
const notReady = () => false;
const reduceOnServer = () => true;
const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function subscribeMotion(change: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", change);
  return () => media.removeEventListener("change", change);
}
const isPageVisible = () => document.visibilityState === "visible";
function subscribeVisibility(change: () => void) {
  document.addEventListener("visibilitychange", change);
  return () => document.removeEventListener("visibilitychange", change);
}

/** Only the visible, resolved-theme video is mounted; SSR always has a static mark. */
export function MadarLoader({
  size = "md",
  variant = "inline",
  label,
  decorative = false,
  className,
}: MadarLoaderProps) {
  const locale = useLocale();
  const { resolvedTheme } = useTheme();
  const hydrated = useHydrated();
  const reduced = useSyncExternalStore(
    subscribeMotion,
    prefersReducedMotion,
    reduceOnServer,
  );
  const pageVisible = useSyncExternalStore(subscribeVisibility, isPageVisible, notReady);
  const container = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) =>
      setInView(entries.some((entry) => entry.isIntersecting)),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const animate =
    hydrated &&
    !reduced &&
    inView &&
    pageVisible &&
    (resolvedTheme === "light" || resolvedTheme === "dark");
  const Container = variant === "inline" ? "span" : "div";
  const text = label || (locale === "ar" ? "جارٍ التحميل" : "Loading");
  return (
    <Container
      role={decorative ? undefined : "status"}
      aria-busy={decorative ? undefined : true}
      aria-hidden={decorative || undefined}
      className={cn(
        "flex min-w-0 items-center justify-center gap-3",
        variant === "inline" ? "inline-flex align-middle" : "flex-col",
        variant === "section" && "min-h-48 py-8",
        variant === "fullscreen" &&
          "min-h-dvh px-4 py-[max(2rem,env(safe-area-inset-top),env(safe-area-inset-bottom))]",
        className,
      )}
    >
      <span
        ref={container}
        aria-hidden="true"
        className={cn(
          "relative inline-block aspect-square max-w-full shrink-0",
          sizes[size],
        )}
      >
        {animate ? (
          <AnimatedMark
            key={resolvedTheme}
            tone={resolvedTheme === "dark" ? "ivory" : "navy"}
          />
        ) : (
          <MadarLogo
            decorative
            className="size-full"
          />
        )}
      </span>
      {!decorative ? (
        <span
          className={cn(
            "min-w-0 text-center text-sm text-muted-foreground wrap-break-word",
            variant === "inline" && !label && "sr-only",
          )}
        >
          {text}
        </span>
      ) : null}
    </Container>
  );
}

function AnimatedMark({ tone }: { tone: "navy" | "ivory" }) {
  const video = useRef<HTMLVideoElement>(null);
  const alphaVerified = useRef(false);
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    // Muted autoplay can still be rejected (power saving/browser settings).
    let disposed = false;
    void element.play().catch(() => {
      if (!disposed) {
        element.pause();
        setFailed(true);
      }
    });
    return () => {
      disposed = true;
      element.pause();
    };
  }, []);
  const fail = (element: HTMLVideoElement) => {
    element.pause();
    setFailed(true);
  };
  return (
    <>
      <MadarLogo
        decorative
        className={cn("size-full", playing && !failed && "invisible")}
      />
      {!failed ? (
        <video
          ref={video}
          src={`/branding/madar-logo-${tone}.webm`}
          width={912}
          height={912}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          controls={false}
          disablePictureInPicture
          tabIndex={-1}
          aria-hidden="true"
          className={cn(
            "absolute inset-0 size-full object-contain",
            !playing && "invisible",
            tone === "navy" ? "dark:hidden" : "hidden dark:block",
          )}
          onLoadedData={(event) => {
            // Some decoders accept VP9 but lose WebM alpha. Both originals have a
            // fully transparent top-left corner; never show an opaque decoder box.
            try {
              const canvas = document.createElement("canvas");
              canvas.width = 1;
              canvas.height = 1;
              const context = canvas.getContext("2d");
              if (!context) {
                fail(event.currentTarget);
                return;
              }
              context.drawImage(event.currentTarget, 0, 0, 1, 1, 0, 0, 1, 1);
              alphaVerified.current = context.getImageData(0, 0, 1, 1).data[3] === 0;
              if (!alphaVerified.current) fail(event.currentTarget);
            } catch {
              fail(event.currentTarget);
            }
          }}
          onPlaying={() => {
            if (alphaVerified.current) setPlaying(true);
          }}
          onError={(event) => fail(event.currentTarget)}
        />
      ) : null}
    </>
  );
}
