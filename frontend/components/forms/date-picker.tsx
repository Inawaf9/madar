"use client";
import { useState } from "react";
import { useLocale } from "next-intl";
import { arSA, enUS } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

function parseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(0); date.setHours(0, 0, 0, 0); date.setFullYear(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : undefined;
}
/** LocalDate: never convert a chosen calendar day through UTC/toISOString(). */
export function DatePicker({ value, onChange, id, invalid, describedBy, inputRef }: { value: string; onChange: (value: string) => void; id?: string; invalid?: boolean; describedBy?: string; inputRef?: (element: HTMLElement | null) => void }) {
  const locale = useLocale(); const ar = locale === "ar"; const [open, setOpen] = useState(false); const selected = parseDate(value);
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger render={<Button ref={inputRef} id={id} type="button" variant="outline" aria-invalid={invalid} aria-describedby={describedBy} className="w-full justify-start font-normal" />}><CalendarDays data-icon="inline-start" />{selected ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", calendar: "gregory" }).format(selected) : ar ? "اختر التاريخ" : "Choose date"}</PopoverTrigger>
    <PopoverContent align="start" className="w-auto max-w-[calc(100vw-2rem)] p-2" dir={ar ? "rtl" : "ltr"}>
      {open ? <Calendar mode="single" locale={ar ? arSA : enUS} dir={ar ? "rtl" : "ltr"} selected={selected} defaultMonth={selected} onSelect={date => { if (date) onChange(`${String(date.getFullYear()).padStart(4, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`); else onChange(""); setOpen(false); }} /> : null}
      <Button type="button" variant="ghost" className="w-full" onClick={() => { onChange(""); setOpen(false); }}>{ar ? "إزالة التاريخ" : "Clear date"}</Button>
    </PopoverContent>
  </Popover>;
}
