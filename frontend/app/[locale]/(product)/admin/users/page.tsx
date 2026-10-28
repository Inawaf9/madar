
import { requireAdminPage } from "@/lib/auth/authorization.server";
import { AdminUsers } from "@/features/account/admin-users";

export const instant = false;

export default async function Page() {
    await requireAdminPage();

    return <AdminUsers />;
}
