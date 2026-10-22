import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useMadarCopy } from "./use-madar-copy";

export function ProductJourneySection() {
  const { text } = useMadarCopy();
  const steps = [text("اكتشف العقارات في مدينتك", "Discover homes in your chosen city"), text("أضف الأماكن المهمة وتفضيلاتك — اختياريًا", "Optionally add important places and preferences"), text("قارن خياراتك من منظور حياتك اليومية", "Compare homes through the lens of daily life")];
  return <section id="compare" className="scroll-mt-24 bg-primary py-14 text-primary-foreground sm:py-16">
    <div className="mx-auto grid max-w-7xl items-center gap-9 px-5 sm:px-8 lg:grid-cols-2 lg:px-12">
      <div><p className="text-sm font-bold opacity-80">{text("تجربة مدار", "THE MADAR EXPERIENCE")}</p><h2 className="mt-3 font-display text-3xl font-bold leading-relaxed sm:text-4xl">{text("قرار السكن أكبر من سعر وموقع.", "There’s more to a home than price and location.")}</h2><p className="mt-4 max-w-xl leading-8 opacity-85">{text("مدار يساعدك تشوف الصورة الأوسع: الأماكن اللي تزورها، إيقاع يومك، والخيارات اللي تستحق المقارنة. ابدأ بالاستكشاف، وأضف تفاصيل حياتك وقت ما يناسبك.", "See the bigger picture: the places you visit, the rhythm of your day, and homes worth comparing. Start exploring, then add the details of your life whenever you choose.")}</p><a href="#places" className={buttonVariants({ variant: "secondary", size: "lg", className: "mt-6 h-12" })}>{text("اكتشف كيف نقارن", "Explore a more personal comparison")}<ArrowLeft data-icon="inline-end" className="ltr:rotate-180" /></a></div>
      <ol id="how-it-works" className="flex scroll-mt-24 flex-col gap-3 rounded-3xl border border-primary-foreground/25 bg-primary-foreground/10 p-5 sm:p-6">{steps.map((step, index) => <li key={step} className="flex items-center gap-3 rounded-2xl bg-primary-foreground/10 p-4"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent font-black text-accent-foreground">{index + 1}</span><span className="text-sm leading-7 sm:text-base">{step}</span></li>)}</ol>
    </div>
  </section>;
}
