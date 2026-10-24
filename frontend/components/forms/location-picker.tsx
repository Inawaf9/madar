"use client";
import { useId, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { LocateFixed, MapPin } from "lucide-react";
import { MadarMap, type PickedLocation } from "@/components/maps/madar-map";
import { validCoordinates } from "@/lib/maps/points";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { SearchableSelect } from "./searchable-select";

export type LocationPreset = PickedLocation & { id: string; name: string };
export function LocationPicker({ value, onChange, id, invalid, describedBy, presets = [], disabled, inputRef }: {
  value: PickedLocation | null; onChange: (value: PickedLocation) => void; id?: string; invalid?: boolean; describedBy?: string; presets?: LocationPreset[]; disabled?: boolean; inputRef?: (element: HTMLElement | null) => void;
}) {
  const ar = useLocale() === "ar"; const uid = useId();
  const [open, setOpen] = useState(false); const [draft, setDraft] = useState<PickedLocation | null>(null);
  const [latitude, setLatitude] = useState(""); const [longitude, setLongitude] = useState("");
  const request = useRef(0);
  const [locating, setLocating] = useState(false); const [error, setError] = useState("");
  const changeOpen = (next: boolean) => { if (!next) { request.current++; setLocating(false); } setOpen(next); };
  const choose = (point: PickedLocation | null) => { request.current++; setLocating(false); setDraft(point); setLatitude(point ? String(point.latitude) : ""); setLongitude(point ? String(point.longitude) : ""); setError(""); };
  const editCoordinate = (lat: string, lng: string) => {
    request.current++; setLocating(false); setLatitude(lat); setLongitude(lng);
    setDraft(lat.trim() && lng.trim() && validCoordinates(Number(lat), Number(lng)) ? { latitude: Number(lat), longitude: Number(lng) } : null);
  };
  return <>
    <Button ref={inputRef} id={id} type="button" variant="outline" disabled={disabled} aria-invalid={invalid} aria-describedby={describedBy} onClick={() => { choose(value); setOpen(true); }} className="h-auto min-h-12 w-full justify-start py-3 whitespace-normal text-start">
      <MapPin data-icon="inline-start" /><span className="min-w-0 flex-1">{value ? ar ? "موقع محدد على الخريطة" : "Location selected on map" : ar ? "اختر الموقع من الخريطة" : "Choose a location on the map"}</span><span className="text-xs text-muted-foreground">{value ? ar ? "تعديل" : "Edit" : ar ? "تحديد" : "Choose"}</span>
    </Button>
    <Dialog open={open} onOpenChange={changeOpen}><DialogContent closeLabel={ar ? "إغلاق" : "Close"} dir={ar ? "rtl" : "ltr"} className="flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-3xl flex-col overflow-y-auto sm:max-w-3xl">
      <DialogHeader><DialogTitle>{ar ? "حدد الموقع" : "Choose location"}</DialogTitle><DialogDescription>{ar ? "اضغط على الخريطة، أو حرّكها ثم اختر الوسط. يمكنك سحب العلامة لضبط الموقع." : "Tap the map, or pan it and choose the center. Drag the marker to fine-tune your selection."}</DialogDescription></DialogHeader>
      {presets.length ? <Field><FieldLabel htmlFor={`${uid}-saved`}>{ar ? "من أماكنك المحفوظة" : "From your saved places"}</FieldLabel><SearchableSelect id={`${uid}-saved`} options={presets.filter(p => validCoordinates(p.latitude, p.longitude)).map(p => ({ value: p.id, label: p.name }))} value="" onChange={key => { const found = presets.find(p => p.id === key); if (found) choose(found); }} /></Field> : null}
      {open ? <MadarMap points={[]} label={ar ? "خريطة اختيار الموقع" : "Location picker map"} locationSelection={{ value: draft, onChange: choose }} /> : null}
      <div className="flex flex-wrap items-center justify-between gap-3"><p role="status" className="text-sm text-muted-foreground">{draft ? ar ? "الموقع جاهز للتأكيد" : "Location ready to confirm" : ar ? "لم تحدد موقعًا بعد" : "No location selected yet"}</p><Button type="button" variant="ghost" disabled={locating} onClick={() => {
        if (!navigator.geolocation) { setError(ar ? "تحديد موقع الجهاز غير متاح؛ اختر من الخريطة." : "Device location is unavailable. Choose on the map."); return; }
        const ticket = ++request.current; setLocating(true); setError("");
        navigator.geolocation.getCurrentPosition(position => { if (ticket !== request.current) return; choose({ latitude: position.coords.latitude, longitude: position.coords.longitude }); setLocating(false); }, () => { if (ticket !== request.current) return; setLocating(false); setError(ar ? "تعذّر تحديد موقعك. يمكنك اختياره من الخريطة." : "Your location could not be retrieved. Choose on the map instead."); }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 });
      }}><LocateFixed data-icon="inline-start" />{locating ? ar ? "جارٍ تحديد الموقع…" : "Locating…" : ar ? "استخدم موقعي" : "Use my location"}</Button></div>
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      <details><summary className="cursor-pointer rounded-lg py-2 text-xs text-muted-foreground">{ar ? "إحداثيات متقدمة" : "Advanced coordinates"}</summary><FieldGroup className="mt-3 grid grid-cols-2 gap-3"><Field><FieldLabel htmlFor={`${uid}-lat`}>{ar ? "خط العرض" : "Latitude"}</FieldLabel><Input id={`${uid}-lat`} dir="ltr" inputMode="decimal" value={latitude} onChange={e => editCoordinate(e.target.value, longitude)} /></Field><Field><FieldLabel htmlFor={`${uid}-lng`}>{ar ? "خط الطول" : "Longitude"}</FieldLabel><Input id={`${uid}-lng`} dir="ltr" inputMode="decimal" value={longitude} onChange={e => editCoordinate(latitude, e.target.value)} /></Field></FieldGroup>{!draft && (latitude || longitude) ? <p role="alert" className="mt-2 text-xs text-destructive">{ar ? "أدخل خط عرض بين ‎-90 و90، وخط طول بين ‎-180 و180." : "Enter latitude from -90 to 90 and longitude from -180 to 180."}</p> : null}</details>
      <DialogFooter><Button type="button" variant="outline" onClick={() => changeOpen(false)}>{ar ? "إلغاء" : "Cancel"}</Button><Button type="button" disabled={!draft || locating} onClick={() => { if (draft) { onChange(draft); changeOpen(false); } }}>{ar ? "تأكيد الموقع" : "Confirm location"}</Button></DialogFooter>
    </DialogContent></Dialog>
  </>;
}
