import "server-only";
import { ApiError } from "@/lib/api/errors";

/** Strict one-use backend rotation has no duplicate-request recovery contract.
 * Stateless cookies cannot provide cross-replica single-flight or generation CAS.
 * This is a deliberate safety boundary, not an environment flag or a local mutex.
 * Before enabling: supply a verified backend idempotency/recovery contract or an
 * authorized distributed coordinator with atomic pair publication/stale-response protection.
 */
export function requireSafeRefreshCoordination(): never {
  throw new ApiError(
    "Refresh coordination unavailable",
    409,
    "Refresh coordination unavailable",
  );
}
