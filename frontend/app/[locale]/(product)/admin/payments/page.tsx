
import { requireAdminPage } from "@/lib/auth/authorization.server";
import { AdminPayments } from "@/features/account/admin-payments";

export const instant = false;

export default async function Page() {
    await requireAdminPage();

    return <AdminPayments />;
}
