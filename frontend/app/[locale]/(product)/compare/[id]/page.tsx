// User-specific content renders after client-side development identity loading.
export const instant = false;
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ComparisonDetail } from "@/features/product/comparisons";
import { Loading } from "@/features/product/shared";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; if (!/^\d+$/.test(id) || Number(id) <= 0 || Number(id) > 2147483647) notFound(); return <Suspense fallback={<Loading />}><ComparisonDetail id={Number(id)} /></Suspense>; }
