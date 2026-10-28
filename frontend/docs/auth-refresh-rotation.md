# Refresh token rotation status

Automatic refresh is intentionally disabled until the deployment has a durable,
shared session coordinator and the backend can recover a rotation whose response
is lost.

The Spring contract is `POST /api/v1/auth/refresh` with
`{"refreshToken":"…"}` and an `AuthResponse` token pair. Refresh tokens are
single-use. `RefreshTokenService.rotateRefreshToken` revokes the token family
when it sees a consumed token. A process-local lock, browser lock, or cookie-only
session therefore cannot safely coordinate requests across tabs and Next.js
instances.

The frontend currently keeps the token pair in the authenticated-encryption
HttpOnly cookie, never in browser storage. The refresh route checks CSRF and
returns `503 Refresh coordination unavailable` without sending a refresh token
to Spring. The response does not clear the session cookie. Access tokens expire
after about 15 minutes, so the current safe behavior requires signing in again
after expiry.

Before enabling rotation, deployment needs both:

1. A durable session store keyed by an opaque session identifier. It must keep
   the current encrypted token pair and a generation number, and support an
   atomic refresh lease plus compare-and-set publication so every BFF instance
   reads the latest pair and stale requests cannot publish an old generation.
2. A backend recovery contract for the crash window after Spring consumes a
   refresh token but before the new pair is committed to the shared store. A
   durable lock alone cannot recover the successor pair in this window; retrying
   the old token currently triggers family revocation. The backend must support
   an idempotency key/replay-safe response or an equivalent recovery operation.

Once those capabilities exist, refresh can be centralized in a server-side
Route Handler. Safe requests may wait for the coordinator and retry once with
the committed generation. Non-idempotent and paid operations must not be
replayed automatically unless their own backend contract guarantees idempotency.
