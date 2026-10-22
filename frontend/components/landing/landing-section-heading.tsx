export function LandingSectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end md:gap-10">
    <div className="md:max-w-[56%]"><p className="text-sm font-bold text-accent-ink">{eyebrow}</p><h2 className="mt-2 font-display text-[clamp(1.625rem,3vw,2.375rem)] font-bold leading-[1.4] text-balance">{title}</h2></div>
    <p className="max-w-lg text-sm leading-7 text-muted-foreground md:max-w-[40%] sm:text-base">{description}</p>
  </div>;
}
