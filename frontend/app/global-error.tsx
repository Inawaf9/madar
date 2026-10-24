"use client";

import { useSyncExternalStore, useTransition } from "react";
import { CircleAlert, RotateCcw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { thmanyahSans, thmanyahDisplay } from "./fonts";
import "./globals.css";

// The root provider tree may have failed, so this boundary must not require
// next-intl, next-themes, TanStack Query, or the application navigation context.
const subscribeTheme = (notify: () => void) => {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", notify);
  window.addEventListener("storage", notify);
  return () => { media.removeEventListener("change", notify); window.removeEventListener("storage", notify); };
};
const darkSnapshot = () => {
  try {
    const theme = localStorage.getItem("theme");
    if (theme === "dark" || theme === "light") return theme === "dark";
  } catch { /* A blocked store does not prevent recovery. */ }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};
export default function GlobalError({ reset, retry }: { error: unknown; reset: () => void; retry?: () => void }) {
  const dark = useSyncExternalStore(subscribeTheme, darkSnapshot, () => false);
  const [pending, startTransition] = useTransition();
  return <html lang="ar" dir="rtl" className={`${thmanyahSans.variable} ${thmanyahDisplay.variable}${dark ? " dark" : ""}`}><body className="grid min-h-svh place-items-center bg-background p-5 font-sans text-foreground"><Card role="alert" className="w-full max-w-xl"><CardHeader><CircleAlert aria-hidden="true" className="mb-3 text-primary" /><CardTitle><h1 className="text-xl font-bold">تعذّر فتح مدار الآن</h1></CardTitle><CardDescription className="leading-7">حدث خطأ أثناء تجهيز التطبيق. أعد المحاولة أو ارجع إلى الرئيسية.</CardDescription></CardHeader><CardFooter className="flex flex-wrap gap-3"><Button disabled={pending} onClick={() => startTransition(() => (retry || reset)())}><RotateCcw data-icon="inline-start" />{pending ? "جارٍ إعادة المحاولة…" : "أعد المحاولة"}</Button><Button nativeButton={false} variant="outline" render={<Link href="/" prefetch={false} />}>الرئيسية</Button></CardFooter></Card></body></html>;
}
