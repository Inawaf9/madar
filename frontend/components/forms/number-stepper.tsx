"use client";
import { useLocale } from "next-intl";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function NumberStepper({
  value,
  onChange,
  min,
  max,
  id,
  invalid,
  describedBy,
  label,
  inputRef,
}: {
  value: number | "";
  onChange: (value: number | "") => void;
  min?: number;
  max?: number;
  id?: string;
  invalid?: boolean;
  describedBy?: string;
  label: string;
  inputRef?: (element: HTMLElement | null) => void;
}) {
  const ar = useLocale() === "ar";
  const finite = value !== "" && Number.isFinite(value);
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={!finite || (min != null && Number(value) <= min)}
        aria-label={`${ar ? "تقليل" : "Decrease"} ${label}`}
        onClick={() => onChange(Math.max(min ?? -Infinity, Number(value) - 1))}
      >
        <Minus />
      </Button>
      <Input
        ref={inputRef}
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        value={finite ? value : ""}
        onChange={(event) =>
          onChange(event.target.value === "" ? "" : event.target.valueAsNumber)
        }
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className="min-w-0 flex-1 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={finite && max != null && Number(value) >= max}
        aria-label={`${ar ? "زيادة" : "Increase"} ${label}`}
        onClick={() =>
          onChange(Math.min(max ?? Infinity, finite ? Number(value) + 1 : (min ?? 1)))
        }
      >
        <Plus />
      </Button>
    </div>
  );
}
