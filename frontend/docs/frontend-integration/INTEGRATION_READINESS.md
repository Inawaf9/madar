# Frontend integration readiness

> Historical handoff: this file describes an earlier 31-operation checkout. Use [INTEGRATION_STATUS.md](INTEGRATION_STATUS.md) for the current 61-endpoint implementation and verification limits; FRONTEND_API_REFERENCE.md remains the contract authority. Earlier runtime reports do not establish runtime verification of the new integration.

Current implementation: existing user-scoped CRUD is connected to localized product pages using the explicitly authorized development ID flow. Runtime evidence and exact remaining product gaps are maintained in [ENDPOINT_COVERAGE.md](ENDPOINT_COVERAGE.md) and [PRODUCT_BACKEND_GAPS.md](PRODUCT_BACKEND_GAPS.md). The production recommendations below remain future backend work, not requirements to add authentication in this frontend phase.

## Verified capabilities

- Versioned `/api/v1` REST mappings, with six feature controllers and 31 endpoints.
- JSON CRUD-like operations for user records, current home, housing preference, place preferences, saved-property references, and comparison references.
- Bean Validation on request entities and a global exception advice.
- External client beans are configured for Kite, Google Routes, Google Places, OpenRouter, and Moyasar.

## Verified implementation gaps and risks

| Priority | Finding | Affected endpoints | Frontend impact | Recommended backend improvement |
|---|---|---|---|---|
| Critical | No authentication mechanism or Spring Security rules found. Most routes accept user IDs in URL; admin routes authorize by looking up supplied `adminId`. | All, especially `/user/admin/*`, user-scoped CRUD | Any client can act as another user or enumerate global data. | Add authenticated identity, authorization by principal, and role-based admin protection before production use. |
| Critical | Registration validates a password then stores the entity directly; service comment confirms BCrypt is TODO. | `POST /api/v1/user/register`; user update routes | Credential compromise risk; no login flow exists. | Hash secrets; define login/session/token lifecycle and password update contract. |
| High | Global list endpoints return unfiltered records across users. | `GET /current-home/get`, `/housing-preference/get`, `/property-comparison/get`; admin endpoint aside | Exposes private user-related data without auth. | Remove public global listing or require privileged authorization and pagination. |
| High | Error contract is inconsistent and collapses many cases into 400; some handlers return plain text. | All | Client must parse heterogeneous errors; cannot reliably distinguish not found, conflict, forbidden, validation. | Use a stable error DTO with code, status, message, field errors; return semantically correct status codes. |
| High | HousingPreference has a non-ignored `user` relation while other entities ignore owners. | Housing preference reads | Response can include nested user fields and can vary/expand shape. | Return explicit response DTO excluding owner and input DTO excluding persistence fields. |
| High | No property listing/search/detail APIs; Kite client unused from application feature code. | No endpoint | Core property search/details pages cannot be implemented from this backend. | Add application-level search/detail/import endpoints backed by Kite and document normalized DTOs. |
| High | Google Routes/Places, OpenRouter, and Moyasar clients have no calling methods or endpoint mappings. | None | Commute, place lookup, AI, and payment frontend flows are absent. | Implement application-level endpoints and lifecycle/error contracts; keep secrets server-side. |
| Medium | Empty result semantics vary: some collections return `[]`, saved property and places produce 400 message; singleton absence also 400. | Saved property/place, current home/housing preference | UI empty states require special handling and requests may look failed. | Return 200 with empty collection; define 404 for missing singleton if appropriate. |
| Medium | No pagination, sorting, filtering, or search parameters. | Current all/list routes | Lists cannot scale and search is unavailable. | Add page/size/sort and query filters with a consistent metadata envelope. |
| Medium | JPA entities are API models; generated and relationship fields are inconsistently protected. | All entity bodies/responses | Persistence details leak into contract; input can include IDs/server-managed fields. | Introduce request/response DTOs and explicit mapping. |
| Medium | `PUT` operations expect a complete validated entity; no PATCH body contract (importance is path-only). | update routes | Partial form edits require resending all required fields. | Clarify replace semantics or add explicit PATCH DTOs. |
| Low | No server port/context path configured; default Spring Boot port is inferred, not verified at runtime. | All | Frontend needs environment-configured base URL. | Document deployed URL per environment and configure allowed origins. |
| Low | No CORS configuration or `@CrossOrigin` found. | Browser calls to all routes | Cross-origin browser requests may be blocked unless deployment proxy is same-origin or global CORS exists externally. | Configure explicit trusted frontend origins and required methods/headers. |

## External integration inventory

| Provider | Source evidence | Used by feature endpoint? | Frontend-visible shape / errors | Production suitability |
|---|---|---|---|---|
| Kite Real Estate | `KiteClient` builds RestClient with configured base URL and Bearer key | No call sites found | No endpoint/response to document | Not directly usable; add secured app-level search/detail/import APIs. |
| Google Routes | `GoogleRoutesClient` sets API key header | No call sites found | None | Not directly usable. |
| Google Places | `GooglePlacesClient` sets API key header | No call sites found | None | Not directly usable; existing place-preference CRUD is unrelated to Places provider search. |
| OpenRouter | `OpenRouterClient` builds Spring AI `ChatClient` | No call sites found | None | Not directly usable. |
| Moyasar | `MoyasarClient` configures Basic Auth | No call sites found; Payment model has no controller | None | Not directly usable; no payment create/status/webhook operations. |

No `/api/test` routes were found. No API client call sites were found outside client construction. External provider failures therefore do not currently map to frontend endpoints.

## Authentication, CORS, and network configuration

No Spring Security dependency/configuration, token/cookie handling, or authorization annotations were found. The service performs some ownership checks by path IDs, but this is not authentication. No CORS mapping or allowed origin was found. `application.properties` sets MySQL at localhost and does not configure `server.port`; Spring Boot's default port is conventionally 8080, but runtime was not verified. Browser integration needs an explicit deployment base URL and same-origin proxy or backend CORS configuration.

## Recommended implementation order

1. Secure identity and ownership; hash passwords and establish authentication.
2. Define DTOs and stable error responses; eliminate unsafe global data endpoints.
3. Add property search and property detail application endpoints using Kite.
4. Normalize collection empty states and add pagination/filtering where relevant.
5. Add provider-backed Places/Routes endpoints and define error behavior.
6. Add payment lifecycle/webhook endpoints before any payment UI.
7. Add AI feature endpoints only after request/response limits and failures are defined.
8. Configure CORS and publish per-environment base URLs.

Recommendations above are architectural, separate from verified source findings. No runtime calls or tests were performed.
