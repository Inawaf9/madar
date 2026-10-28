
import { requireAdminPage } from "@/lib/auth/authorization.server";
import { AdminCredits } from "@/features/account/admin-credits";

export const instant = false;

export default async function Page() {
    await requireAdminPage();
    return <AdminCredits />;
}
