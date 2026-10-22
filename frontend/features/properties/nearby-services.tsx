"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { discovery } from "@/lib/api/discovery";
import { categories } from "@/lib/api/discovery-contracts";
import { GoogleMap } from "@/components/maps/google-map";
import { Button } from "@/components/ui/button";
import { ErrorState, Loading, Panel } from "@/features/product/shared";
export function NearbyServices({ latitude, longitude }: { latitude: number; longitude: number }) {
  const [category, setCategory] = useState<string>("supermarket"); const [request, setRequest] = useState<string | null>(null);
  const query = useQuery({ queryKey: ["nearby-services", latitude, longitude, request], queryFn: ({ signal }) => discovery.nearby(latitude, longitude, request!, 2000, signal), enabled: request !== null, retry: false });
  const places = query.data?.places?.filter(p => p != null) || [];
  return <Panel title="الخدمات القريبة" description="نتائج المزوّد ضمن نطاق البحث؛ لا تمثل حصرًا كاملًا ولا أوقات قيادة.">
    <div className="flex flex-col gap-4"><label className="flex flex-col gap-2 text-sm">نوع الخدمة<select value={category} onChange={e => { setCategory(e.target.value); setRequest(null); }} className="h-11 rounded-xl border bg-background px-3">{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></label><Button disabled={query.isFetching} onClick={() => { if (request === category) void query.refetch(); else setRequest(category); }}>اعرض الخدمات</Button>
    {request && query.isPending ? <Loading /> : query.isError ? <ErrorState error={query.error} retry={() => void query.refetch()} /> : query.isSuccess ? <><GoogleMap points={[{ id: "property", title: "العقار", latitude, longitude }, ...places.map((p, i) => ({ id: p.id || `place-${i}`, title: p.displayName?.text || "خدمة", latitude: p.location?.latitude ?? null, longitude: p.location?.longitude ?? null, description: p.formattedAddress }))]} /><ul className="flex flex-col gap-2">{places.map((p, i) => <li key={p.id || i} className="rounded-xl bg-secondary p-3 text-sm">{p.displayName?.text || "مكان بدون اسم"}<p className="text-xs text-muted-foreground">{p.formattedAddress}</p></li>)}</ul>{!places.length ? <p>لم يُرجع المزوّد خدمات مطابقة.</p> : null}</> : null}
    </div>
  </Panel>;
}
