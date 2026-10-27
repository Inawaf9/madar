import { requirePageSession } from "@/lib/auth/authorization.server";
// Private content requires a server-side session.
export const instant = false;
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ComparisonDetail } from "@/features/comparisons/comparisons";
import { ComparisonSkeleton } from "@/features/comparisons/skeletons";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requirePageSession();
  const { id } = await params;
  if (!/^\d+$/.test(id) || Number(id) <= 0 || Number(id) > 2147483647) notFound();
  return (
    <Suspense fallback={<ComparisonSkeleton detail />}>
      <ComparisonDetail id={Number(id)} />
    </Suspense>
  );
}
