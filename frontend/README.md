# MADAR Frontend

Next.js App Router client for MADAR, localized in Arabic and English. The public marketing site and consumer-facing product shell are available in Arabic and English.

## Local development

1. Copy `.env.example` to `.env.local` and set `API_BASE_URL` to the backend's URL (the default local backend is `http://localhost:8080`).
2. Run `pnpm dev`.
3. Open `/ar` or `/en`. The product experience is under `/ar/app` and `/en/app`; property discovery is under `/ar/app/properties` and `/en/app/properties`.

Sign-in and registration pages are available at `/sign-in` and `/register`, but credential submission is disabled. The backend has no login/session endpoint, does not hash passwords during registration, and does not authorize user ownership. The frontend does not accept credentials or call user-scoped endpoints with a manually selected ID.

## Isolated staging

The backend proxy remains disabled unless running local development against a loopback host or explicitly configuring `MADAR_UNAUTHENTICATED_API_ENV=isolated-staging`. For Vercel, the app additionally refuses this setting when `VERCEL_ENV=production`.

An enabled staging deployment must be inaccessible from the public internet, use non-sensitive test data, and have network-level restrictions. The environment check does not authenticate callers. Never set the staging flag on a public production deployment. Authentication and authorization must be completed before public launch.

## Supported backend capabilities

The backend currently supports ID-scoped CRUD for place preferences, saved external property references, comparison reference pairs, current-home coordinates, housing preferences, and profile reads. Those endpoints cannot be exposed safely until identity and owner authorization exist. Live property search/details/import, route calculation, comparison analysis, and secure authentication are not available. The product screens state these limitations without sample records or simulated success. See [`docs/frontend-integration/PRODUCT_BACKEND_GAPS.md`](docs/frontend-integration/PRODUCT_BACKEND_GAPS.md).

The endpoint inventory, DTO constraints, error shapes, and feature gaps are documented in [`docs/frontend-integration`](docs/frontend-integration/FRONTEND_HANDOFF.md). API access is centralized in `lib/api` and forwarded through the allowlisted same-origin route handler.

## Checks

- `pnpm lint`
- `pnpm exec tsc --noEmit --incremental false`
- `pnpm build`
