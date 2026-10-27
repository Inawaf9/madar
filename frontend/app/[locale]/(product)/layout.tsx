import { Suspense } from "react";
import { ProductShell } from "@/features/workspace/product-shell";
import { requirePageSession } from "@/lib/auth/authorization.server";
export const instant = false;
async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  await requirePageSession();
  return <ProductShell>{children}</ProductShell>;
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </Suspense>
  );
}
