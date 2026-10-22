"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { useMadarCopy } from "./use-madar-copy";
import type { PreviewProperty } from "./preview-data";

export type PreviewPanelValue = "saved" | "compare" | "place" | PreviewProperty | null;

export function PreviewPanel({ panel, saved, compared, onClose, onToggleSaved }: {
  panel: PreviewPanelValue;
  saved: PreviewProperty[];
  compared: PreviewProperty[];
  onClose: () => void;
  onToggleSaved: (property: PreviewProperty) => void;
}) {
  const { text, ar, locale } = useMadarCopy();
  const format = (value: number | null) => value == null ? text("غير متاح", "Unavailable") : new Intl.NumberFormat(locale).format(value);
  const title = panel === "saved" ? text("محفوظات المعاينة", "Preview favorites")
    : panel === "compare" ? text("مقارنة نماذج السكن", "Compare preview homes")
    : panel === "place" ? text("أماكنك المهمة — على طريقتك", "Your important places, your way")
    : panel?.title || text("تفاصيل المعاينة", "Preview details");
  const items = panel === "saved" ? saved : panel === "compare" ? compared : panel && typeof panel === "object" ? [panel] : [];

  return (
    <Sheet open={panel !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side={ar ? "right" : "left"} showCloseButton={false} className="w-[calc(100%-1rem)] overflow-y-auto pb-6 sm:max-w-xl">
        <SheetClose render={<Button variant="ghost" size="icon-lg" className="absolute end-4 top-4" aria-label={text("إغلاق المعاينة", "Close preview")} />}><X /></SheetClose>
        <SheetHeader className="pe-14">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{text("معاينة توضيحية فقط. لا قوائم فعلية ولا حفظ دائم ولا حساب لمسارات التنقل.", "Illustrative preview only. No live listings, permanent saving, or calculated routes.")}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-6">
          {panel === "place" ? (
            <>
              <p className="leading-8 text-muted-foreground">{text("مكان عملك، مدرسة الأطفال، أو منزل العائلة. يمكنك لاحقًا إضافة وجهاتك لتقييم خيارات السكن حول إيقاع يومك. التخصيص اختياري؛ استكشاف العقارات لا يتطلب إضافة أماكن.", "Your workplace, school, or family home. You will be able to add destinations to evaluate homes around your day. Personalization is optional; browsing does not require adding places.")}</p>
              <Button variant="outline" onClick={onClose}>{text("فهمت", "Got it")}</Button>
            </>
          ) : !items.length ? (
            <Empty><EmptyHeader><EmptyTitle>{text("لا توجد اختيارات بعد", "No selections yet")}</EmptyTitle><EmptyDescription>{text("اختر مدينة وفعّل معاينة التصميم، ثم أضف نموذجًا من البطاقات.", "Choose a city and enable the design preview, then select a sample card.")}</EmptyDescription></EmptyHeader></Empty>
          ) : panel === "compare" ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-80 text-start text-sm">
                <caption className="mb-3 text-start text-muted-foreground">{text("أسعار ومساحات توضيحية؛ لا تشمل حساب التنقل أو درجة ملاءمة.", "Illustrative prices and areas; no calculated commute or match scores.")}</caption>
                <thead><tr className="border-b"><th scope="col" className="p-3 text-start">{text("العقار", "Home")}</th><th scope="col" className="p-3 text-start">{text("السعر", "Price")}</th><th scope="col" className="p-3 text-start">{text("المساحة", "Area")}</th></tr></thead>
                <tbody>{items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <th scope="row" className="p-3 text-start font-medium"><bdi>{item.title || "—"}</bdi><p className="text-xs text-muted-foreground">{item.city || "—"}</p></th>
                    <td className="p-3"><bdi>{format(item.price)}</bdi><p className="text-xs text-muted-foreground">{item.purpose === "rent" ? text("ر.س / سنة", "SAR / year") : text("ر.س • بيع", "SAR • sale")}</p></td>
                    <td className="p-3"><bdi>{format(item.areaSqm)} {item.areaSqm != null ? text("م²", "m²") : ""}</bdi></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : items.map((item) => (
            <article key={item.id} className="rounded-2xl border bg-background p-5">
              <h3 className="break-words font-bold"><bdi>{item.title || text("عنوان غير متاح", "Title unavailable")}</bdi></h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.city || text("الموقع غير متاح", "Location unavailable")}</p>
              <p className="mt-3 font-bold text-primary"><bdi>{format(item.price)} {item.price != null ? text("ر.س", "SAR") : ""}</bdi> · {item.purpose === "rent" ? text("إيجار سنوي", "Yearly rent") : text("بيع", "Sale")}</p>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">{text("غرف النوم", "Bedrooms")}</dt><dd>{format(item.bedrooms)}</dd>
                <dt className="text-muted-foreground">{text("الحمامات", "Bathrooms")}</dt><dd>{format(item.bathrooms)}</dd>
                <dt className="text-muted-foreground">{text("المساحة", "Area")}</dt><dd><bdi>{format(item.areaSqm)} {item.areaSqm != null ? text("م²", "m²") : ""}</bdi></dd>
              </dl>
              <Button variant="outline" className="mt-4 h-10" onClick={() => onToggleSaved(item)}>{saved.some((p) => p.id === item.id) ? text("إزالة من المعاينة", "Remove from favorites") : text("حفظ في المعاينة", "Save in preview")}</Button>
            </article>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
