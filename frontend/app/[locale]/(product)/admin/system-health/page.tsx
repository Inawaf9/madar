
import { requireAdminPage } from "@/lib/auth/authorization.server";
import { AdminSystemHealthPanel } from "@/features/account/admin-monitoring";

export const instant = false;

export default async function Page() {
    await requireAdminPage();
    return <AdminSystemHealthPanel />;
}
