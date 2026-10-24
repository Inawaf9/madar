"use client";
import { useId } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { SelectOption } from "./searchable-select";
import { cn } from "@/lib/utils";
export function ChoiceCards({ options, value, onChange, id, invalid, describedBy, disabled, inputRef }: {
  options: readonly SelectOption[]; value: string; onChange: (value: string) => void; id?: string; invalid?: boolean; describedBy?: string; disabled?: boolean; inputRef?: (element: HTMLElement | null) => void;
}) {
  const generated = useId();
  return <RadioGroup id={id} value={value} onValueChange={next => onChange(String(next))} disabled={disabled} aria-invalid={invalid} aria-describedby={describedBy} className={cn("grid gap-2", options.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3")}>
    {options.map((option, index) => <label key={option.value} htmlFor={`${generated}-${index}`} className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-border/70 px-3 py-2.5 text-sm transition-colors hover:bg-secondary/40 has-data-checked:border-primary has-data-checked:bg-primary/8 has-data-checked:font-medium has-disabled:cursor-not-allowed has-disabled:opacity-60 motion-reduce:transition-none">
      <RadioGroupItem ref={index === 0 ? inputRef : undefined} id={`${generated}-${index}`} value={option.value} disabled={option.disabled} /><span className="min-w-0 wrap-break-word">{option.label}</span>
    </label>)}
  </RadioGroup>;
}
