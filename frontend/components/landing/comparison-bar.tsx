"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { useMadarCopy } from "./use-madar-copy";

export function ComparisonBar({ count, onOpen, onClear }: { count: number; onOpen: () => void; onClear: () => void }) {
  const { text, locale } = useMadarCopy();
  const reduced = useReducedMotion();
  return <AnimatePresence>{count > 0 ? <motion.aside initial={reduced ? false : { opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} aria-label={text("مقارنة المعاينة", "Preview comparison")} className="fixed inset-x-3 bottom-4 z-40 mx-auto flex max-w-lg flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-foreground p-4 text-background shadow-stone"><p role="status" className="text-sm">{new Intl.NumberFormat(locale).format(count)} {text("نماذج للمقارنة", "preview homes selected")}</p><div className="flex gap-2"><Button variant="secondary" onClick={onOpen} disabled={count < 2}>{text("قارن الآن", "Compare now")}</Button><Button variant="secondary" onClick={onClear}>{text("مسح", "Clear")}</Button></div>{count < 2 ? <p className="w-full text-xs opacity-80">{text("أضف نموذجًا ثانيًا لبدء المقارنة", "Add a second sample to compare")}</p> : null}</motion.aside> : null}</AnimatePresence>;
}
