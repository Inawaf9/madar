import { Suspense } from "react";
import { requirePageSession } from "@/lib/auth/authorization.server";
import { MovingChecklistPage } from "@/features/moving/moving-checklist-page";

export const instant = false;

export default async function Page() {
  await requirePageSession();
  return (
    <Suspense fallback={<div className="h-80 animate-pulse rounded-3xl bg-secondary" />}>
      <MovingChecklistPage />
    </Suspense>
  );
}
