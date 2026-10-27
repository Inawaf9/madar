import { requirePageSession } from "@/lib/auth/authorization.server";
import { PaymentReturn } from "@/features/payments/payment-page";
export default async function Page() {
  await requirePageSession();
  return <PaymentReturn />;
}
