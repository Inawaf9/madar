import { AuthForm } from "@/features/auth/auth-form";
import { isUnauthenticatedBackendAccessEnabled } from "@/lib/api/access";
export default function Page() { return <AuthForm mode="login" developmentEnabled={isUnauthenticatedBackendAccessEnabled()} />; }
