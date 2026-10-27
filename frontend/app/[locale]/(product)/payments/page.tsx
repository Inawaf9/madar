import { requirePageSession } from "@/lib/auth/authorization.server";
import { PaymentsPage } from "@/features/payments/payment-page";
export default async function Page() {
  await requirePageSession();
  return <PaymentsPage />;
}
