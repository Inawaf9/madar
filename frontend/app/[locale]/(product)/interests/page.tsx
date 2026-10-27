import { requirePageSession } from "@/lib/auth/authorization.server";
import { InterestsPage } from "@/features/account/interests";

// IdentityGate resolves the local profile in the browser, outside this probe.
export const instant = false;

export default async function Page() {
  await requirePageSession();
  return <InterestsPage />;
}
