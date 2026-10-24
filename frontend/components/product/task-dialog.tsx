"use client";
import { useLocale } from "next-intl";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
export function TaskDialog({ open, onOpenChange, title, description, busy = false, children }: {
  open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: string; busy?: boolean; children: React.ReactNode;
}) {
  const ar = useLocale() === "ar";
  return <Dialog open={open} onOpenChange={next => { if (!busy) onOpenChange(next); }}><DialogContent showCloseButton={!busy} dir={ar ? "rtl" : "ltr"} closeLabel={ar ? "إغلاق" : "Close"} className="max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain p-5 sm:max-w-2xl sm:p-6 [&_[data-form-actions]]:sticky [&_[data-form-actions]]:bottom-0 [&_[data-form-actions]]:bg-popover [&_[data-form-actions]]:py-3">
    <DialogHeader className="pe-8"><DialogTitle>{title}</DialogTitle><DialogDescription>{description || (ar ? "احفظ التغييرات عندما تنتهي." : "Save your changes when ready.")}</DialogDescription></DialogHeader>{children}
  </DialogContent></Dialog>;
}
