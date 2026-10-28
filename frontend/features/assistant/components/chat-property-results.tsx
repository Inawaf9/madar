"use client";
import { useState } from "react";
import { useLocale } from "next-intl";
import { useReducedMotion } from "motion/react";
import { PropertyCardView } from "@/features/properties/property-card-view";
import { PropertyActions } from "@/features/properties/property-card";
import { propertyHref } from "@/features/properties/format";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";
import type { ChatProperty } from "@/lib/api/chat";
import { adaptChatProperty } from "../chat-property-adapter";
import { usePropertyCarouselWheel } from "../hooks/use-property-carousel-wheel";
import { useAssistant } from "../assistant-context";

export function ChatPropertyResults({ properties }: { properties: ChatProperty[] }) {
  const locale = useLocale();
  const ar = locale === "ar";
  const direction = ar ? "rtl" : "ltr";
  const reduced = useReducedMotion();
  const { setOpen, canChat, send, busy } = useAssistant();
  const [api, setApi] = useState<CarouselApi>();
  usePropertyCarouselWheel(api, direction, reduced);
  if (!properties.length) return null;
  return (
    <Carousel
      key={direction}
      dir={direction}
      opts={{
        direction,
        align: "start",
        loop: false,
        containScroll: "trimSnaps",
        duration: reduced ? 0 : 22,
      }}
      setApi={setApi}
      tabIndex={0}
      aria-label={ar ? "بيوت مقترحة في المحادثة" : "Homes suggested in chat"}
      className="w-full min-w-0 max-w-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring [&_[data-slot=carousel-content]]:overscroll-x-contain"
    >
      <CarouselContent className="ms-0">
        {properties.map((dto, index) => {
          const { listing, property } = adaptChatProperty(dto, locale);
          const href = property ? propertyHref(property) : undefined;
          return (
            <CarouselItem
              key={`${dto.source}:${dto.externalId}:${index}`}
              className="basis-[min(230px,88%)] pe-2 ps-0"
              aria-label={
                ar
                  ? `البيت ${index + 1} من ${properties.length}`
                  : `Property ${index + 1} of ${properties.length}`
              }
            >
              <PropertyCardView
                variant="compact"
                listing={listing}
                href={href}
                onNavigate={() => setOpen(false)}
                overlayActions={
                  property && canChat ? (
                    <PropertyActions
                      property={property}
                      overlay
                    />
                  ) : undefined
                }
                footer={
                  href ? (
                    <>
                      <Button
                        nativeButton={false}
                        render={
                          <Link
                            href={href}
                            onNavigate={() => setOpen(false)}
                          />
                        }
                        variant="outline"
                        size="sm"
                      >
                        {ar ? "التفاصيل" : "Details"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy || !canChat}
                        onClick={() => {
                          const text = ar
                            ? `اعرض بيوتًا مشابهة لهذا البيت من المصدر ${dto.source}.`
                            : `Find properties similar to external ID ${dto.externalId} from source ${dto.source}.`;
                          send({ type: "text", text }, text);
                        }}
                      >
                        {ar ? "مشابهة" : "Similar"}
                      </Button>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {ar
                        ? "مرجع الإعلان غير متاح للإجراءات."
                        : "Listing reference unavailable for actions."}
                    </p>
                  )
                }
              />
            </CarouselItem>
          );
        })}
      </CarouselContent>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-caption text-muted-foreground">
          {ar ? "بيوت مقترحة · اسحب للمزيد" : "Suggested homes · swipe for more"}
        </span>
        <div className="flex gap-1">
          <CarouselPrevious
            className="static inset-auto m-0 size-10 rounded-full"
            aria-label={ar ? "البيت السابق" : "Previous home"}
          />
          <CarouselNext
            className="static inset-auto m-0 size-10 rounded-full"
            aria-label={ar ? "البيت التالي" : "Next home"}
          />
        </div>
      </div>
    </Carousel>
  );
}
