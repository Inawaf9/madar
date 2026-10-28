
import { requireAdminPage } from "@/lib/auth/authorization.server";
import { AdminAuditLogs } from "@/features/account/admin-monitoring";

export const instant = false;

export default async function Page() {
    await requireAdminPage();
    return <AdminAuditLogs />;
}
