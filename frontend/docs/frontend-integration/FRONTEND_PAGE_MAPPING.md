# Frontend page-to-API mapping

Updated 2026-10-20. The original backend inventory remains in `API_ENDPOINTS.md`.
User-scoped operations are intentionally available for **local development** using
`madar_user_id`; this is not authentication and the API proxy is gated outside local/isolated environments.

| Route (both `/ar` and `/en`) | Product workflow | Existing API integration |
|---|---|---|
| `/` | Existing marketing website, working entry actions | No listing fixtures are presented as API results; CTAs link to product routes |
| `/register` | Name/email/password form; real registration | `POST /user/register`; returns only a message, so automatic ID entry is a documented backend gap |
| `/login` | Validated credential form; distinct local test-account access | No login endpoint exists. Development ID access verifies `GET /user/get/{userId}` before storing ID |
| `/dashboard` | Personalized account overview, actual counts, shortlist, housing preferences and navigation | User, saved-reference, place, comparison and housing-preference reads; preference create/update/delete |
| `/properties` | Organize and search the user's saved references, add a manual reference | Saved-reference GET/POST/DELETE; filtering is local, never sent as unsupported search parameters |
| `/properties/[id]` | Saved reference detail and actions | Selects the real saved record returned by user-scoped GET; no live listing details are claimed |
| `/saved` | Add, view and remove saved references; choose one for a pair | All saved-property operations; comparison selection preserves the chosen saved reference |
| `/locations` | Optional important-place create/read/edit/remove and importance editing | All five place-preference operations; real manually supplied coordinates, no invented Places or Routes integration |
| `/compare` | Select two saved homes, persist pairs, compare available reference data, delete | Comparison list/add/delete and saved-reference list; semantic reference table |
| `/compare/[id]` | Read owned pair and change selected homes | Comparison-by-ID and full update; saved-reference list supplies selections |
| `/profile` | Account read/update/delete, current-home and housing-preference CRUD | All supported user-scoped account, current-home and housing-preference operations |
| `/sign-in`, `/app`, `/app/properties`, `/workspace/*` | Compatibility redirects | Redirect to `/login`, `/dashboard` or `/properties` while preserving locale; no workshop interface |

There is no consumer admin screen or public cross-account list. Three admin mappings and three
unfiltered global reads are exercised as internal integration checks only, excluded from the proxy.
Full per-endpoint evidence: [ENDPOINT_COVERAGE.md](ENDPOINT_COVERAGE.md).
Missing listing, login and analysis contracts: [PRODUCT_BACKEND_GAPS.md](PRODUCT_BACKEND_GAPS.md).
