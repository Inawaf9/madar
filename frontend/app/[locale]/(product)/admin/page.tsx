
import { requireAdminPage } from "@/lib/auth/authorization.server";
import { AdminOverview } from "@/features/account/admin-overview";

export const instant = false;

export default async function Page() {
  await requireAdminPage();

  return <AdminOverview />;
}
