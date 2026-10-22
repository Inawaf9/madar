# MADAR backend gaps for the current development product

> Historical handoff: this file describes an earlier 31-operation checkout. Use [INTEGRATION_STATUS.md](INTEGRATION_STATUS.md) for the current 61-endpoint implementation and verification limits; FRONTEND_API_REFERENCE.md remains the contract authority. Earlier runtime reports do not establish runtime verification of the new integration.

Verified on 2026-10-20 against every document in this directory and the controllers,
services, models and provider clients in `../Backend/src/main/java/com/example/madar/`.
The 31 existing mappings are accounted for in [ENDPOINT_COVERAGE.md](ENDPOINT_COVERAGE.md).
No backend source was changed. Proposed routes below are **not implemented or called**.

## Exact gaps and proposed contracts

| Capability | Required method/path (proposal unless existing) | Request | Required response | Current frontend behavior |
|---|---|---|---|---|
| Automatic entry after registration | Existing `POST /api/v1/user/register` must return the created user | Existing `fullName`, `email`, `password`, `role: USER` | `UserResponse {id,fullName,email,role,createdAt}` instead of only `{message}` | Real form submits registration. A message-only success explains the missing ID and never fabricates one. |
| Email/password login | Proposed `POST /api/v1/user/login` | `{email,password}`; verify the persisted password | `UserResponse` including actual `id`; invalid credentials return a documented error | Validated login form exists. No unsupported HTTP request is sent, no credentials are accepted, no identity is fabricated. Local development access separately verifies a supplied test ID using the real user read. |
| Property search | Proposed `GET /api/v1/properties` | Define supported city/district/budget/type filters, sorting and pagination explicitly | Document normalized listing summaries, metadata and provider errors | `/properties` organizes real saved references; no fake search results or unsupported query parameters. |
| Live listing details | Proposed `GET /api/v1/properties/{source}/{externalPropertyId}` | Source and listing reference | Actual listing fields, images, price, availability, attribution and missing-field behavior | `/properties/[id]` shows a saved record's title/source/reference only. It is explicitly a saved-reference detail, not live listing detail. |
| External URL import | Proposed `POST /api/v1/properties/import` | `{url}` | Resolved normalized listing or a documented error | Manual reference saving works. URL extraction/import is not offered without a contract. |
| Google Places lookup | Proposed `GET /api/v1/places/search` | Document query, region restrictions, pagination and detail-selection contract | Suggestions, provider identifiers, actual coordinates, attribution | Important locations support manual real coordinates and free-text categories. |
| Route calculations | Proposed `POST /api/v1/routes/calculate` | Document origins/destinations, mode and departure time | Distances and durations with units, provider attribution and errors | No commute metrics are displayed. CRUD of locations works independently. |
| Actual property comparison | Proposed `POST /api/v1/property-comparison/analyze/{userId}/{comparisonId}` | Define whether options/locations are required | Resolved property facts and documented comparable metrics | Existing comparison pair CRUD and reference comparison table are functional. No price or suitability data is invented. |
| AI/recommendations | Proposed `POST /api/v1/recommendations/{userId}` | Define preferences, property references, consent, model configuration and limits | Document analysis DTO, provenance and failure contract | No AI request or fabricated AI result. |

Kite, Google Places, Google Routes, OpenRouter and Moyasar classes only construct clients.
They have no feature call sites or controller mappings. There is no `/api/test` controller.
Dashboard aggregation is **not a blocker**: the frontend composes existing user-scoped reads.
Profile updates are **not blocked**: the form supplies the required password and `role: USER`.
Logout needs no backend route: it clears `madar_user_id`, cancels requests and clears Query cache.

## Development boundary

This phase intentionally uses `madar_user_id` in localStorage. It is not authentication.
Registration currently stores plaintext passwords in Spring Boot, so use test credentials only.
No JWT, cookie, session, OAuth, middleware authentication or Spring Security was added.
The existing server proxy remains available only for local development with a loopback backend,
or explicitly isolated staging using `MADAR_UNAUTHENTICATED_API_ENV=isolated-staging`.
It is disabled for ordinary public production and Vercel production. Server-only `API_BASE_URL`
keeps upstream configuration out of browser bundles. Actual authentication and authorization
remain future backend work; they do not block these explicitly authorized local workflows.

## Record and deletion behavior

The user entity's comparison relationship has no delete cascade. The account deletion
workflow explicitly deletes the user's comparison pairs through the documented endpoints
before calling user deletion. A failed request remains visible; identity and cache clear only
after account deletion succeeds. The integration suite also removes its own test pairs.
