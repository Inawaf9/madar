import { requirePageSession } from "@/lib/auth/authorization.server";
// Private content requires a server-side session.
export const instant = false;
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { SavedDetail } from "@/features/saved/saved";
import { SavedDetailSkeleton } from "@/features/properties/skeletons";
// Share the segment name with public provider details; URLs remain unchanged.
export default async function Page({
  params,
}: {
  params: Promise<{ propertyKey: string }>;
}) {
  await requirePageSession();
  const { propertyKey: id } = await params;
  if (!/^\d+$/.test(id) || Number(id) <= 0 || Number(id) > 2147483647) notFound();
  return (
    <Suspense fallback={<SavedDetailSkeleton />}>
      <SavedDetail id={Number(id)} />
    </Suspense>
  );
}
