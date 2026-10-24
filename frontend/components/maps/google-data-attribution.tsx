import Image from "next/image";
/** Attribution for the separate text-only Google Places / Routes presentation. */
export function GoogleDataAttribution() {
  return <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
    <p className="text-xs leading-6 text-muted-foreground">مصدر بيانات الأماكن والتنقل: Google Maps. تُعرض هذه النتائج في قائمة مستقلة عن الخريطة.</p>
    <span className="shrink-0 px-2.5 pb-1.5 pt-2.5">
      <Image src="/attribution/google-maps-light.png" alt="Google Maps" width={98} height={18} className="h-[18px] w-auto dark:hidden" />
      <Image src="/attribution/google-maps-dark.png" alt="Google Maps" width={98} height={18} className="hidden h-[18px] w-auto dark:block" />
    </span>
  </div>;
}
