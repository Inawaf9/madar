import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { regions } from "./regions";
import { LandingSectionHeading } from "./landing-section-heading";
import { useMadarCopy } from "./use-madar-copy";

export function RegionalShowcaseSection() {
  const { text, ar } = useMadarCopy();
  return <section id="regions" className="scroll-mt-24 pb-16 pt-6 sm:pb-20"><div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
    <LandingSectionHeading eyebrow={text("تنوع المملكة", "THE CHARACTER OF SAUDI ARABIA")} title={text("هوية واحدة، وطبائع معمارية مختلفة", "One identity. Many architectural expressions.")} description={text("من الطين النجدي إلى أزرق الساحل وحجر الشمال. حكاية بصرية مستوحاة من مناطق المملكة، لا تعبّر عن نطاق توفر العقارات.", "From Najdi clay to coastal blue and northern stone. A visual story inspired by Saudi regions, independent of listing availability.")} />
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{regions.map((region) => <article key={region.id} className={cn("relative flex min-h-44 flex-col items-start justify-between overflow-hidden rounded-2xl border border-border/50 p-6", region.surface)}><Badge variant="outline">{text(region.labelAr, region.labelEn)}</Badge><div className="relative"><h3 className="text-xl font-bold">{ar ? region.ar : region.en}</h3><p className="mt-1 text-xs text-muted-foreground">{text(region.areaAr, region.areaEn)}</p></div><div aria-hidden="true" className={cn("absolute -bottom-7 end-5 h-32 w-20 rounded-t-full opacity-30", region.tone)} /><span aria-hidden="true" className={cn("absolute end-6 top-6 size-2.5 rounded-full", region.tone)} /></article>)}</div>
  </div></section>;
}
