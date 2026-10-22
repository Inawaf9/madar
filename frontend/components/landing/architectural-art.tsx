import { cn } from "@/lib/utils";

export function ArchitecturalArt({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("relative isolate overflow-hidden bg-[linear-gradient(140deg,var(--illustration-sky),var(--illustration-sand))]", className)}>
    <div className="absolute bottom-0 start-[12%] h-[76%] w-[38%] rounded-t-2xl bg-[repeating-linear-gradient(90deg,var(--illustration-wall)_0_13px,var(--illustration-window)_13px_17px,var(--illustration-wall)_17px_41px)] shadow-[inset_-14px_0_#00000010]" />
    <div className="absolute bottom-0 start-[46%] h-[55%] w-[36%] rounded-t-2xl bg-[repeating-linear-gradient(90deg,var(--illustration-wall)_0_29px,var(--illustration-window)_29px_33px)] shadow-[inset_-14px_0_#00000010]" />
    <div className="absolute -end-[3%] bottom-0 h-[42%] w-[24%] rounded-t-2xl bg-[repeating-linear-gradient(90deg,var(--illustration-sand)_0_23px,var(--illustration-window)_23px_27px)]" />
    <div className="absolute inset-0 bg-[linear-gradient(0deg,color-mix(in_srgb,var(--illustration-ink)_62%,transparent),transparent_65%)]" />
  </div>;
}
