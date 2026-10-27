import { requireAdminPage } from "@/lib/auth/authorization.server";
import { AdminUsers } from "@/features/account/admin-users";
export const instant = false;
export default async function Page() {
  await requireAdminPage();
  // Private data goes through the BFF so upstream 401 can clear cookies in a writable context.
  return <AdminUsers />;
}
