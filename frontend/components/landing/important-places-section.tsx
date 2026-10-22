"use client";
import { BriefcaseBusiness, GraduationCap, House, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { LandingSectionHeading } from "./landing-section-heading";
import { useMadarCopy } from "./use-madar-copy";
import { usePreview } from "./preview-provider";

export function ImportantPlacesSection() {
  const { text } = useMadarCopy();
  const { openPanel } = usePreview();
  const places = [
    { Icon: BriefcaseBusiness, label: text("مقر العمل", "Workplace"), time: text("١٨ دقيقة*", "18 min*") },
    { Icon: GraduationCap, label: text("مدرسة الأطفال", "Children’s school"), time: text("١٢ دقيقة*", "12 min*") },
    { Icon: MapPin, label: text("منزل العائلة", "Family home"), time: text("٢٥ دقيقة*", "25 min*") },
  ];
  return <section id="places" className="scroll-mt-24 py-12 sm:py-17"><div id="personalize" className="mx-auto max-w-7xl scroll-mt-24 px-5 sm:px-8 lg:px-12">
    <LandingSectionHeading eyebrow={text("الأماكن المهمة", "PLACES THAT MATTER")} title={text("بيتك قريب من حياتك", "A home close to your life")} description={text("العمل، المدرسة، والأهل. شوف خيارات السكن من حول الأماكن اللي تعطي يومك معناه.", "Work, school, and family. Consider your next home around the places that give your days meaning.")} />
    <div className="grid gap-5 lg:grid-cols-2">
      <div role="img" aria-label={text("رسم خريطة توضيحي لمسار بين المنزل والعمل، دون بيانات خرائط فعلية", "Illustrative route between home and work, without real map data")} className="relative isolate min-h-[340px] overflow-hidden rounded-3xl border bg-[linear-gradient(130deg,var(--map-ground),var(--map-green))]">
        <div aria-hidden="true" className="absolute -inset-[30%] -rotate-9 bg-[repeating-linear-gradient(30deg,transparent_0_48px,color-mix(in_srgb,var(--illustration-paper)_40%,transparent)_48px_58px,transparent_58px_100px),repeating-linear-gradient(115deg,transparent_0_78px,color-mix(in_srgb,var(--illustration-paper)_50%,transparent)_78px_88px,transparent_88px_130px)]" />
        <div aria-hidden="true" className="absolute start-[24%] top-[33%] h-[35%] w-[48%] rounded-ee-3xl border-b-4 border-s-4 border-dashed border-primary" />
        <span className="absolute start-[15%] top-[24%] flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"><House className="size-4" />{text("المنزل", "Home")}</span>
        <span className="absolute bottom-[20%] end-[13%] flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-card-foreground"><BriefcaseBusiness className="size-4" />{text("العمل", "Work")}</span>
        <p className="absolute bottom-4 start-4 rounded-full bg-card/95 px-3 py-1 text-xs text-muted-foreground">{text("رسم توضيحي • ليس خريطة فعلية", "Illustration • not a real map")}</p>
      </div>
      <Card className="border"><CardHeader><CardTitle><h3 className="text-2xl font-bold leading-relaxed">{text("قارن بناءً على الأماكن اللي تهمك", "Compare around your important places")}</h3></CardTitle><CardDescription>{text("أضف العمل أو المدرسة أو أي وجهة تزورها باستمرار. مثال بصري لما قد تبدو عليه رحلتك اليومية.", "Add work, school, or any regular destination. A visual example of how your daily journeys could be presented.")}</CardDescription></CardHeader><CardContent><ul className="flex flex-col gap-3">{places.map(({ Icon, label, time }) => <li key={label} className="flex items-center justify-between gap-3 rounded-xl bg-background p-3 text-sm"><span className="flex items-center gap-2"><Icon className="size-4 text-muted-foreground" />{label}</span><b className="shrink-0 text-primary">{time}</b></li>)}</ul></CardContent><CardFooter className="flex-col items-stretch gap-3"><Button size="lg" className="h-12" onClick={() => openPanel("place")}><Plus data-icon="inline-start" />{text("إضافة مكان مهم", "Add an important place")}</Button><p className="text-xs leading-6 text-muted-foreground">{text("* أوقات افتراضية للتوضيح، وليست حسابات تنقّل. إضافة الأماكن اختيارية.", "* Illustrative times, not calculated travel estimates. Adding places is optional.")}</p></CardFooter></Card>
    </div>
  </div></section>;
}
