"use client";
import { useEffect } from "react";
import type { CarouselApi } from "@/components/ui/carousel";

/** Touch, keys and buttons use Embla; horizontal wheel gestures never consume vertical scrolling. */
export function usePropertyCarouselWheel(
  api: CarouselApi,
  direction: "rtl" | "ltr",
  reduced: boolean | null,
) {
  useEffect(() => {
    if (!api) return;
    const viewport = api.rootNode();
    let distance = 0;
    let last = 0;
    let moved = -Infinity;
    const wheel = (event: WheelEvent) => {
      if (
        event.ctrlKey ||
        (!event.shiftKey && Math.abs(event.deltaX) <= Math.abs(event.deltaY))
      )
        return;
      const delta = event.deltaX || (event.shiftKey ? event.deltaY : 0);
      if (!delta) return;
      const next = direction === "rtl" ? delta < 0 : delta > 0;
      if (next ? !api.canScrollNext() : !api.canScrollPrev()) return;
      event.preventDefault();
      if (event.timeStamp - last > 150 || Math.sign(distance) !== Math.sign(delta))
        distance = 0;
      last = event.timeStamp;
      distance += delta;
      if (Math.abs(distance) < 28 || event.timeStamp - moved < 180) return;
      if (next) api.scrollNext(!!reduced);
      else api.scrollPrev(!!reduced);
      distance = 0;
      moved = event.timeStamp;
    };
    viewport.addEventListener("wheel", wheel, { passive: false });
    return () => viewport.removeEventListener("wheel", wheel);
  }, [api, direction, reduced]);
}
