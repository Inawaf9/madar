# MADAR Frontend

Next.js 16 App Router frontend for MADAR, localized in Arabic and English.

## Local development

1. Configure `MADAR_BACKEND_BASE_URL=http://localhost:8080` and the exact frontend `MADAR_APP_ORIGIN` using `.env.example` as a reference. Keep existing provider settings.
2. Run `pnpm auth:cookie-key` to create an independent cookie encryption key in ignored `.env.local`. It does not display or overwrite an existing key.
3. Start the documented Spring backend, then run `pnpm dev`.
4. Open `/ar/login`, `/en/login`, `/ar/register`, or `/en/register`. Public discovery is under `/ar/properties` and `/en/properties`; the authenticated experience starts at `/ar/dashboard` or `/en/dashboard`.

Spring owns registration, login, JWT issuance/validation, account state, and authorization. Next.js transports its access JWT inside an jose JWE (dir/A256GCM) encrypted, authenticated HttpOnly cookie and sends Bearer headers only from allowlisted server BFF handlers. No frontend database, session service, JWT signing key, or browser token storage is required.

Production requires HTTPS and the same stable server-only `MADAR_AUTH_COOKIE_SECRET` on all Next.js instances. The new Spring token-pair/refresh/logout contracts are integrated. Logout revokes a refresh family; logout-all invalidates access account-wide. Automatic rotation is deliberately blocked because the strict single-use contract has no safe coordination/recovery mechanism for stateless replicas; the current frontend requires login after at most 15 minutes. See [auth implementation and setup](docs/FRONTEND_AUTH_IMPLEMENTATION.md).

Business integrations follow the JWT controller migration: personal routes use `/me`, AI routes omit the caller ID, and administrative routes retain only target IDs. See the [complete frontend migration report](docs/FRONTEND_JWT_MIGRATION_REPORT.md) for endpoint coverage, strict DTOs, and remaining limitations.

## Static validation

- `pnpm lint`
- `pnpm exec tsc --noEmit --incremental false`
- `pnpm build`
