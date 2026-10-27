import Image from "next/image";
import { useLocale } from "next-intl";
/** Attribution for the separate text-only Google Places / Routes presentation. */
export function GoogleDataAttribution() {
  const ar = useLocale() === "ar";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
      <p className="text-xs leading-6 text-muted-foreground">
        {ar
          ? "بيانات الأماكن والمشاوير من Google Maps. نعرض النتائج في قائمة مستقلة عن الخريطة."
          : "Place and commute data comes from Google Maps. Results appear in a separate list from the map."}
      </p>
      <span className="shrink-0 px-2.5 pb-1.5 pt-2.5">
        <Image
          src="/attribution/google-maps-light.png"
          alt="Google Maps"
          width={98}
          height={18}
          className="h-[18px] w-auto dark:hidden"
        />
        <Image
          src="/attribution/google-maps-dark.png"
          alt="Google Maps"
          width={98}
          height={18}
          className="hidden h-[18px] w-auto dark:block"
        />
      </span>
    </div>
  );
}
