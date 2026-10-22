# MADAR frontend integration handoff

> Historical handoff: this file describes an earlier 31-operation checkout. Use [INTEGRATION_STATUS.md](INTEGRATION_STATUS.md) for the current 61-endpoint implementation and verification limits; FRONTEND_API_REFERENCE.md remains the contract authority. Earlier runtime reports do not establish runtime verification of the new integration.

Implementation update (2026-10-20): the authorized local ID-based product now integrates all existing consumer mappings. See [FRONTEND_PAGE_MAPPING.md](FRONTEND_PAGE_MAPPING.md), [ENDPOINT_COVERAGE.md](ENDPOINT_COVERAGE.md) and [PRODUCT_BACKEND_GAPS.md](PRODUCT_BACKEND_GAPS.md) for current UI and runtime evidence. Earlier production-security recommendations below do not block the explicitly scoped local development flow.

This note is for the Next.js frontend agent. It summarizes the current backend contract as inspected in source. Full endpoint details: [API_ENDPOINTS.md](API_ENDPOINTS.md); types and field constraints: [API_SCHEMAS.md](API_SCHEMAS.md); failures: [API_ERRORS.md](API_ERRORS.md); page mapping: [FRONTEND_PAGE_MAPPING.md](FRONTEND_PAGE_MAPPING.md); readiness gaps: [INTEGRATION_READINESS.md](INTEGRATION_READINESS.md).

## Base URL and routing

- API routes use `/api/v1/...`.
- No `server.port` is configured. Spring Boot commonly defaults to `http://localhost:8080`, but this has not been runtime-verified. This frontend reads the server-only `API_BASE_URL` through a same-origin proxy; do not expose the backend URL or credentials as `NEXT_PUBLIC_*` values.
- No API prefix/context path beyond controller mappings was found.
- Send JSON bodies with `Content-Type: application/json`.

## Authentication and browser access

- There is no implemented login, token, cookie, or Spring Security setup. No auth header is required by source.
- User-scoped endpoints take `userId` in the URL; this does not establish caller identity. Do not treat those endpoints as secure multi-user access.
- Admin checks also rely on a caller-provided `adminId` and database role, not an authenticated principal.
- No backend CORS policy was found. Browser calls from a separate origin may be blocked; this frontend uses a same-origin server proxy.

## Response conventions

- Reads return entity JSON or JSON arrays; entity shapes are described in `API_SCHEMAS.md`.
- Successful writes return `{ "message": "..." }`, usually 200; create-current-home and create-housing-preference/comparison return 201; registration and saved-property/place adds return 200.
- Most handled failures are HTTP 400 with `{ "message": "..." }`. Some route/media errors return plain text. Error message strings are not a stable machine-readable code.
- Some collection reads return `[]` when empty, while place and saved-property list routes return 400 when empty.
- Dates are Java `LocalDate` or `LocalDateTime`; no explicit serializer format was found.
- There is no pagination, sorting, search query, or multipart API.

## Existing endpoints by feature

- **Users:** registration, get/update/delete account, and admin list/update/delete at `/api/v1/user/...`. Registration is not login and the service does not hash the password.
- **Current home:** list all, get by user, add/update/delete at `/api/v1/current-home/...`.
- **Housing preference:** list all, get by user, add/update/delete at `/api/v1/housing-preference/...`.
- **Important places:** list/add/update/delete/change importance at `/api/v1/place-preference/...`.
- **Saved property references:** list/add/delete at `/api/v1/saved-property/...`; stores external IDs/source and optional title only.
- **Comparison references:** list all/by user/by ID, add/update/delete at `/api/v1/property-comparison/...`; stores two external property identifiers and sources only.

## Important frontend types

- `UserResponse`: `{ id, fullName, email, role, createdAt }`; password is write-only.
- `HousingPreference`: `{ id, region, city, district?, maxBudget, propertyType, listingType }`; `listingType` is `rent | sale`. Its response may also serialize nested `user` data due to a missing `@JsonIgnore`.
- `PlacePreference`: name/type/latitude/longitude/importance/visitPerWeek.
- `SavedProperty`: externalPropertyId/source/titleSnapshot?/savedAt.
- `PropertyComparison`: first/second property ID and source plus id/createdAt.
- `CurrentHome`: latitude/longitude plus optional externalPropertyId/source/movedInAt and server timestamps.

## Feature availability

The first practical pages are important locations, profile display/edit, current-home and housing-preference forms, saved-property reference management, and comparison-pair management. These are data-management features only and require ID-based calls. Property search, property detail, URL import, actual property comparisons, login, directions, provider place lookup, AI, and payments have no application endpoint.

Although Kite, Google Places, Google Routes, OpenRouter, and Moyasar client beans are present, source contains no application call sites or endpoints for them. No `/api/test` endpoint exists. Do not call provider integrations directly from the browser or treat client bean configuration as an API contract.

## Practical integration notes

- Handle validation/business failures as 400 and parse both JSON `{message}` and plain text.
- Treat 400 “no places/saved properties” as an empty state only when that exact feature request returns it; current API does not return a stable empty collection in those cases.
- Do not show raw error text from framework/database failures to end users.
- Avoid implementing multi-user production flows until backend authentication and owner scoping are added.
- No runtime verification was performed; examples in the detailed docs are illustrative.
