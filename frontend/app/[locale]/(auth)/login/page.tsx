import { AuthForm } from "@/features/product/auth";
import { isUnauthenticatedBackendAccessEnabled } from "@/lib/api/access";
export default function Page() { return <AuthForm mode="login" developmentEnabled={isUnauthenticatedBackendAccessEnabled()} />; }
