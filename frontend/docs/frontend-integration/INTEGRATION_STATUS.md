# MADAR frontend integration status

Current source review: 2026-10-21. This report supersedes older 31-endpoint handoffs. The 61-operation inventory and available Spring source are the contract authority. **Integrated means wired implementation, not runtime verification. No application, tests, provider charge, build, commit, or push was executed for this work.**

## Coverage of all 61 operations

| # | Endpoint | HTTP method | Frontend page/component | Status | Loading/error handling | Limitation / exclusion |
|---:|---|---|---|---|---|---|
| 1 | `/api/v1/properties/search` | GET | /properties → PropertySearchPage | Integrated | Component pending/error/retry; route boundary | Provider/network availability required. |
| 2 | `/api/v1/properties/search/{city}/{listingType}/{propertyType}/{maxPrice}` | GET | Public search replaces the legacy route | Intentionally excluded | N/A | Legacy fixed-page alias; primary cursor search covers existing search/filter UI. No redundant API calls or artificial counts. |
| 3 | `/api/v1/properties/get/{source}/{externalId}` | GET | /properties/[source]/[externalId] → PropertyDetailPage; saved detail; ComparisonListings | Integrated | Component pending/error/retry; route boundary | Provider/network availability required. |
| 4 | `/api/v1/properties/by-preferences/{userId}` | GET | /dashboard → RecommendationsPanel | Integrated | Component pending/error/retry; route boundary | User-scoped proxy retains existing development/isolated-staging deployment boundary. |
| 5 | `/api/v1/properties/near-location/{city}/{listingType}/{propertyType}/{latitude}/{longitude}/{radiusKm}` | GET | Public search replaces the legacy route | Intentionally excluded | N/A | Legacy fixed-page alias; primary cursor search covers existing search/filter UI. No redundant API calls or artificial counts. |
| 6 | `/api/v1/properties/within-budget/{userId}` | GET | /dashboard → RecommendationsPanel | Integrated | Component pending/error/retry; route boundary | User-scoped proxy retains existing development/isolated-staging deployment boundary. |
| 7 | `/api/v1/properties/under-budget-margin/{userId}/{margin}` | GET | /dashboard → RecommendationsPanel | Integrated | Component pending/error/retry; route boundary | User-scoped proxy retains existing development/isolated-staging deployment boundary. |
| 8 | `/api/v1/properties/by-districts/{city}/{listingType}/{propertyType}/{districts}` | GET | Public search replaces the legacy route | Intentionally excluded | N/A | Legacy fixed-page alias; primary cursor search covers existing search/filter UI. No redundant API calls or artificial counts. |
| 9 | `/api/v1/properties/price-range/{city}/{listingType}/{propertyType}/{minPrice}/{maxPrice}` | GET | Public search replaces the legacy route | Intentionally excluded | N/A | Legacy fixed-page alias; primary cursor search covers existing search/filter UI. No redundant API calls or artificial counts. |
| 10 | `/api/v1/properties/sort/{city}/{listingType}/{sortBy}` | GET | Public search replaces the legacy route | Intentionally excluded | N/A | Legacy fixed-page alias; primary cursor search covers existing search/filter UI. No redundant API calls or artificial counts. |
| 11 | `/api/v1/properties/price-stats/{city}/{listingType}/{propertyType}` | GET | /dashboard → market statistics | Integrated | Component pending/error/retry; route boundary | Provider/network availability required. |
| 12 | `/api/v1/properties/results-count/{city}/{listingType}` | GET | Public search replaces the legacy route | Intentionally excluded | N/A | Legacy fixed-page alias; primary cursor search covers existing search/filter UI. No redundant API calls or artificial counts. |
| 13 | `/api/v1/properties/similar/{source}/{externalId}` | GET | PropertyDetailPage → similar options | Integrated | Component pending/error/retry; route boundary | Provider/network availability required. |
| 14 | `/api/v1/user/register` | POST | /register → AuthForm | Partially integrated | Component pending/error/retry; route boundary | POST works; source returns message only. No userId/login/me contract, so automatic local profile bootstrap is blocked. |
| 15 | `/api/v1/user/get/{userId}` | GET | IdentityGate, /profile | Integrated | Component pending/error/retry; route boundary | User-scoped proxy retains existing development/isolated-staging deployment boundary. |
| 16 | `/api/v1/user/update/{userId}` | PUT | /profile → account DataForm | Integrated | Validation + pending duplicate-submit prevention + success/error; GET invalidation | User-scoped proxy retains existing development/isolated-staging deployment boundary. |
| 17 | `/api/v1/user/delete/{userId}` | DELETE | /profile → confirmed DeleteAction | Integrated | Validation + pending duplicate-submit prevention + success/error; GET invalidation | User-scoped proxy retains existing development/isolated-staging deployment boundary. |
| 18 | `/api/v1/user/admin/get-all/{adminId}` | GET | No consumer UI; proxy denies route | Intentionally excluded | N/A | Administrative/global data (class D). Caller-editable IDs are not trusted administration. |
| 19 | `/api/v1/user/admin/update/{adminId}/{userId}` | PUT | No consumer UI; proxy denies route | Intentionally excluded | N/A | Administrative/global data (class D). Caller-editable IDs are not trusted administration. |
| 20 | `/api/v1/user/admin/delete/{adminId}/{userId}` | DELETE | No consumer UI; proxy denies route | Intentionally excluded | N/A | Administrative/global data (class D). Caller-editable IDs are not trusted administration. |
| 21 | `/api/v1/housing-preference/get` | GET | No consumer UI; proxy denies route | Intentionally excluded | N/A | Administrative/global data (class D). Caller-editable IDs are not trusted administration. |
| 22 | `/api/v1/housing-preference/get-by-user/{userId}` | GET | /profile, /dashboard → HousingPanel | Integrated | Component pending/error/retry; route boundary | User-scoped proxy retains existing development/isolated-staging deployment boundary. |
| 23 | `/api/v1/housing-preference/add/{userId}` | POST | HousingPanel → create | Integrated | Validation + pending duplicate-submit prevention + success/error; GET invalidation | User-scoped proxy retains existing development/isolated-staging deployment boundary. |
| 24 | `/api/v1/housing-preference/update/{userId}/{preferenceId}` | PUT | HousingPanel → update | Integrated | Validation + pending duplicate-submit prevention + success/error; GET invalidation | User-scoped proxy retains existing development/isolated-staging deployment boundary. |
| 25 | `/api/v1/housing-preference/delete/{userId}/{preferenceId}` | DELETE | HousingPanel → delete | Integrated | Validation + pending duplicate-submit prevention + success/error; GET invalidation | User-scoped proxy retains existing development/isolated-staging deployment boundary. |
| 26 | `/api/v1/housing-preference/match-summary/{userId}` | GET | /dashboard → match summary | Integrated | Component pending/error/retry; route boundary | User-scoped proxy retains existing development/isolated-staging deployment boundary. |
| 27 | `/api/v1/place-preference/get/{userId}` | GET | /locations; CommutePanel prerequisites | Integrated | Component pending/error/retry; route boundary | User-scoped proxy retains existing development/isolated-staging deployment boundary. |
| 28 | `/api/v1/place-preference/add/{userId}` | POST | /locations → add destination | Integrated | Validation + pending duplicate-submit prevention + success/error; GET invalidation | User-scoped proxy retains existing development/isolated-staging deployment boundary. |
| 29 | `/api/v1/place-preference/update/{userId}/{placeId}` | PUT | /locations → edit destination | Integrated | Validation + pending duplicate-submit prevention + success/error; GET invalidation | User-scoped proxy retains existing development/isolated-staging deployment boundary. |
| 30 | `/api/v1/place-preference/delete/{userId}/{placeId}` | DELETE | /locations → delete destination | Integrated | Validation + pending duplicate-submit prevention + success/error; GET invalidation | User-scoped proxy retains existing development/isolated-staging deployment boundary. |
| 31 | `/api/v1/place-preference/importance/{userId}/{placeId}/{importance}` | PATCH | /locations → importance form | Integrated | Validation + pending duplicate-submit prevention + success/error; GET invalidation | User-scoped proxy retains existing development/isolated-staging deployment boundary. |
| 32 | `/api/v1/place-preference/calculate-commutes/{userId}` | GET | PropertyDetailPage → CommutePanel | Integrated | Component pending/error/retry; route boundary | User-scoped proxy retains existing development/isolated-staging deployment boundary. Requires valid destinations, coordinates, active COMMUTE_REPORT pass and Google Routes availability. |
| 33 | `/api/v1/place-preference/nearby-services` | GET | PropertyDetailPage → NearbyServices | Integrated | Component pending/error/retry; route boundary | Provider/network availability required. |
| 34 | `/api/v1/essential-interest/get/{userId}` | GET | /interests → InterestsPage | Integrated | Component pending/error/retry; route boundary | User-scoped proxy retains existing development/isolated-staging deployment boundary. |
| 35 | `/api/v1/essential-interest/add/{userId}` | POST | /interests → add form | Integrated | Validation + pending duplicate-submit prevention + success/error; GET invalidation | User-scoped proxy retains existing development/isolated-staging deployment boundary. |
| 36 | `/api/v1/essential-interest/update/{userId}/{interestId}` | PUT | /interests → edit form | Integrated | Validation + pending duplicate-submit prevention + success/error; GET invalidation | User-scoped proxy retains existing development/isolated-staging deployment boundary. |
| 37 | `/api/v1/essential-interest/delete/{userId}/{interestId}` | DELETE | /interests → DeleteAction | Integrated | Validation + pending duplicate-submit prevention + success/error; GET invalidation | User-scoped proxy retains existing development/isolated-staging deployment boundary. |
| 38 | `/api/v1/current-home/get` | GET | No consumer UI; proxy denies route | Intentionally excluded | N/A | Administrative/global data (class D). Caller-editable IDs are not trusted administration. |
| 39 | `/api/v1/current-home/get-by-user/{userId}` | GET | /profile, /neighborhood → HomePanel | Integrated | Component pending/error/retry; route boundary | User-scoped proxy retains existing development/isolated-staging deployment boundary. |
| 40 | `/api/v1/current-home/add/{userId}` | POST | HomePanel → create | Integrated | Validation + pending duplicate-submit prevention + success/error; GET invalidation | User-scoped proxy retains existing development/isolated-staging deployment boundary. |
| 41 | `/api/v1/current-home/update/{userId}/{homeId}` | PUT | HomePanel → update | Integrated | Validation + pending duplicate-submit prevention + success/error; GET invalidation | User-scoped proxy retains existing development/isolated-staging deployment boundary. |
| 42 | `/api/v1/current-home/delete/{userId}/{homeId}` | DELETE | HomePanel → delete | Integrated | Validation + pending duplicate-submit prevention + success/error; GET invalidation | User-scoped proxy retains existing development/isolated-staging deployment boundary. |
| 43 | `/api/v1/current-home/{userId}/confirm-move` | POST | HomePanel → ConfirmMove | Integrated | Component pending/error/retry; route boundary | User-scoped proxy retains existing development/isolated-staging deployment boundary. |
| 44 | `/api/v1/current-home/{userId}/neighborhood` | GET | /neighborhood → overview | Integrated | Component pending/error/retry; route boundary | User-scoped proxy retains existing development/isolated-staging deployment boundary. |
| 45 | `/api/v1/current-home/{userId}/nearby-by-category` | GET | /neighborhood → category search | Integrated | Component pending/error/retry; route boundary | User-scoped proxy retains existing development/isolated-staging deployment boundary. |
| 46 | `/api/v1/current-home/{userId}/nearest-essential` | GET | /neighborhood → nearest essentials | Integrated | Component pending/error/retry; route boundary | User-scoped proxy retains existing development/isolated-staging deployment boundary. FOUND / NO_MATCH / SEARCH_FAILED rendered per interest, including failures under HTTP 200. |
| 47 | `/api/v1/current-home/{userId}/nearby-search` | GET | /neighborhood → text search | Integrated | Component pending/error/retry; route boundary | User-scoped proxy retains existing development/isolated-staging deployment boundary. |
| 48 | `/api/v1/saved-property/get/{userId}` | GET | /saved; PropertyActions; /compare | Integrated | Component pending/error/retry; route boundary | User-scoped proxy retains existing development/isolated-staging deployment boundary. |
| 49 | `/api/v1/saved-property/add/{userId}` | POST | PropertyActions, /saved → reference form | Integrated | Validation + pending duplicate-submit prevention + success/error; GET invalidation | User-scoped proxy retains existing development/isolated-staging deployment boundary. |
| 50 | `/api/v1/saved-property/delete/{userId}/{savedPropertyId}` | DELETE | PropertyActions, /saved → DeleteAction | Integrated | Validation + pending duplicate-submit prevention + success/error; GET invalidation | User-scoped proxy retains existing development/isolated-staging deployment boundary. |
| 51 | `/api/v1/property-comparison/get` | GET | No consumer UI; proxy denies route | Intentionally excluded | N/A | Administrative/global data (class D). Caller-editable IDs are not trusted administration. |
| 52 | `/api/v1/property-comparison/get-by-user/{userId}` | GET | /compare → ComparisonsPage | Integrated | Component pending/error/retry; route boundary | User-scoped proxy retains existing development/isolated-staging deployment boundary. |
| 53 | `/api/v1/property-comparison/get-by-id/{userId}/{comparisonId}` | GET | /compare/[id] → ComparisonDetail | Integrated | Component pending/error/retry; route boundary | User-scoped proxy retains existing development/isolated-staging deployment boundary. |
| 54 | `/api/v1/property-comparison/add/{userId}` | POST | /compare → PairForm | Integrated | Validation + pending duplicate-submit prevention + success/error; GET invalidation | User-scoped proxy retains existing development/isolated-staging deployment boundary. |
| 55 | `/api/v1/property-comparison/update/{userId}/{comparisonId}` | PUT | /compare/[id] → PairForm | Integrated | Validation + pending duplicate-submit prevention + success/error; GET invalidation | User-scoped proxy retains existing development/isolated-staging deployment boundary. |
| 56 | `/api/v1/property-comparison/delete/{userId}/{comparisonId}` | DELETE | /compare → DeleteAction | Integrated | Validation + pending duplicate-submit prevention + success/error; GET invalidation | User-scoped proxy retains existing development/isolated-staging deployment boundary. |
| 57 | `/api/v1/payments/{userId}/checkout` | POST | PropertyDetailPage → CommutePanel → MoyasarForm | Integrated | Component pending/error/retry; route boundary | User-scoped proxy retains existing development/isolated-staging deployment boundary. Moyasar configuration required; canonical backend verification/access is authoritative. |
| 58 | `/api/v1/payments/{userId}/{paymentId}/verify` | GET | /payments → verify; /payments/return | Integrated | Component pending/error/retry; route boundary | User-scoped proxy retains existing development/isolated-staging deployment boundary. Moyasar configuration required; canonical backend verification/access is authoritative. |
| 59 | `/api/v1/payments/webhook` | POST | Provider → backend only | Intentionally excluded | N/A | Webhook class C. Never called from the browser. |
| 60 | `/api/v1/payments/{userId}` | GET | /payments → PaymentsPage | Integrated | Component pending/error/retry; route boundary | User-scoped proxy retains existing development/isolated-staging deployment boundary. Moyasar configuration required; canonical backend verification/access is authoritative. |
| 61 | `/api/v1/payments/{userId}/access/{serviceType}` | GET | CommutePanel; PaymentReturn → access check | Integrated | Component pending/error/retry; route boundary | User-scoped proxy retains existing development/isolated-staging deployment boundary. Moyasar configuration required; canonical backend verification/access is authoritative. |

Totals: **47 Integrated, 1 Partially integrated, 13 Intentionally excluded = 61**. The registration-to-local-profile journey is blocked by the backend response contract; no invented endpoint is counted as a 62nd operation. There are 6 administrative/global exclusions, 1 webhook exclusion, and 6 superseded legacy discovery exclusions.

## Public discovery and route compatibility

- `/properties` is public and uses the primary query search. Its page moved out of the IdentityGate product route group; its URL is unchanged. `/saved` remains the existing saved-reference workflow.
- The legacy numeric `/properties/[id]` route still opens saved-reference details and now resolves the listing through the documented detail endpoint. New public details use `/properties/[source]/[externalId]`, with IDs preserved as strings.
- Filter state is validated, URL-backed, shareable and supports browser history. City starts empty and is mandatory; no nationwide or silent Riyadh search. The full filter set, rent/sale, normalized yearly-rent prices, sort and limit are supported.
- Cursor pages use TanStack infinite queries. Each continuation preserves filters and passes only the opaque cursor. Filter changes reset the result key and pagination. Duplicate cursors/cards are suppressed; resultWindowReached stops continuation. No total/page count is invented. Load-more state lives in the query cache; an explicit URL cursor is also accepted as a starting point.
- No city/neighborhood catalog endpoints exist. The main form accepts an explicit validated city slug and known optional neighborhood ID; backend/provider validation remains authoritative. The landing form routes to the same real search.
- Public queries bypass the existing user-scope environment fence; admin/global/webhook paths are never allowlisted. The BFF forwards the query string and Idempotency-Key, keeps provider credentials server-side, and uses no-store for all responses.

## Local user context and registration blocker

- The small shared local-user hook reads localStorage only after hydration, validates positive Java Integer IDs, and subscribes to same-tab/cross-tab changes. IdentityGate fetches the corresponding safe profile. Missing IDs render an actionable state rather than an endless spinner; clearing/signing out removes the ID and query cache.
- Local ID entry is explicitly development identity selection, not password authentication. The old nonfunctional password-login submission was removed. No security library, session, JWT, OAuth, admin discovery, or fake login API was added.
- `POST /user/register` returns `{message}` in the checked UserController. It cannot supply the newly generated user ID. Registration success is shown honestly, without auto-sign-in or scraping admin/global reads. A backend response returning a safe user ID (or a separate agreed bootstrap) is required to finish this journey.
- User-scoped proxy access retains the pre-existing local-development / explicitly isolated-staging fence (`MADAR_UNAUTHENTICATED_API_ENV=isolated-staging`, not ordinary production). Public discovery is available independently. This is a deployment boundary, not authorization.

## Google Maps JavaScript integration

- Added `@vis.gl/react-google-maps` 1.10.1 and its necessary `@types/google.maps` declarations. One shared APIProvider lives in the existing query-provider tree. No browser Places/Routes library or duplicate maps package is used.
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is documented in `.env.example` with no real key. It is intentionally browser-visible: restrict HTTP referrers to authorized frontend domains and restrict APIs to Maps JavaScript API. Do not reuse a server/unrestricted Google key.
- Optional `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` enables AdvancedMarker. Without it, regular markers are supported; no fabricated/demo Map ID is required.
- Maps are connected to public property details, backend nearby services, important destinations, current home, neighborhood overview, category/text results and essential-interest matches. Only validated finite returned coordinates become markers. Markers show titles/info windows and bounds fit actual available points.
- GoogleMap handles missing key, script/auth loading failure, map skeleton, empty markers and invalid coordinates in a stable responsive container. Provider colorScheme follows the current theme. No fake locations, routes, or travel times are drawn. Backend Google endpoints remain authoritative for nearby data and paid driving output.
- Official references: [APIProvider](https://visgl.github.io/react-google-maps/docs/api-reference/components/api-provider), [Map](https://visgl.github.io/react-google-maps/docs/api-reference/components/map).

## Moyasar checkout and entitlement

- `NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY` in `.env.example` must be a browser `pk_*` key. No secret key is copied into frontend code.
- The official Moyasar Payment Form 2.3.0 is loaded only in checkout. It supports the backend Payment Intent model using `use_payment_intent`, returned intent ID/client secret, backend `given_id`, and metadata. Amount/currency come from checkout and are displayed in halalas conversion; no authoritative amount is sent by the client.
- Sequence: load actual saved destinations → freshly check access → if access already exists, calculate without purchase → otherwise explicitly create/resume checkout using a canonical UUID Idempotency-Key → render official form → return → backend verify by the local numeric payment ID → recheck entitlement → allow paid calculation only after backend access confirmation.
- The backend intent locks amount, currency, description and callback URL. Moyasar form display fields cannot change those locked values. Backend `moyasar.callback-url` must be an HTTPS URL returning to this same frontend origin at `/{locale}/payments/return`; the frontend cannot override its locked callback. The returned metadata and reserved givenId are passed unchanged.
- Checkout secrets stay only in component memory. Session storage retains only non-sensitive attempt UUID, numeric local payment ID, and return coordinates; no card data or clientSecret is persisted or logged. Retry reuses the attempt key. A failed attempt can explicitly release its key after backend verification.
- `/payments` supports history/status filters and manual canonical verification. `/payments/return` ignores redirect status as proof, verifies the stored local payment ID and independently rechecks access. Pending, failed/expired, refunded and active access states remain distinct. No unbounded polling or webhook calls are used.
- Leaving the form cancels only the UI, not the provider attempt: the backend has no browser cancellation endpoint. The UI directs users to verify the existing attempt instead of claiming cancellation or starting a duplicate.
- Missing keys, HTTPS callback/webhook/service setup, provider account enablement, or Google Routes availability can block live operation. The backend checkout may return 400/409/502/503; no successful payment or travel estimate is fabricated.
- Official references: [Payment Intent fulfillment / form v2.3+](https://docs.moyasar.com/guides/payment-intents/fulfill-an-intent), [given_id and metadata](https://docs.moyasar.com/api/payment_intents/02-fulfill-payment-intent). Orbit discovery returned no relevant provider contract for this task; official vendor documentation and the actual SDK were consulted instead.

## Loading, errors, design and verification

- Added route error boundaries at locale, public, product and auth groups, with standard error/reset props and retry support for this installed Next version. They do not display stack traces or provider secrets. Added genuine route not-found UI without turning arbitrary HTTP 400 into 404.
- Added route-specific loading files for public search/details, existing saved-reference details, dashboard, profile, saved homes, comparisons/list-detail, locations, interests, neighborhood, payments and payment return, plus auth loading. Shared skeleton variants reflect search cards, details, forms, comparisons, maps and payments.
- API queries and mutations retain independent pending/error/empty/success states. Errors are normalized without exposing raw SQL/provider payloads. Forms have field validation, mutation pending and success feedback through the existing Sonner system. 429/502/402/403/409/400 are distinguished with user-readable Arabic messages.
- Existing Stone & Ink tokens and local public/font typography remain unchanged. UI uses the existing shadcn primitives and Tailwind classes; the latest side-by-side Hero is preserved.
- Static source TypeScript/ESLint checks only. The ordinary project-wide TypeScript command sees stale generated validators referencing old/missing paths under `.next*`; source checking uses a temporary config outside the project that excludes generated caches. No generated routes were rebuilt to hide those stale files.
- No runtime requests to Spring, Google Maps, Kite or Moyasar were made. No tests or builds were created/run. No commit/push or backend edits. Installed package build scripts were not approved or run. Live behavior, external credentials, provider payments, callback deployment and browser rendering remain unverified.

## Remaining work / deployment requirements

1. Supply API_BASE_URL and permitted user-scope deployment configuration; keep administrative operations excluded.
2. Supply browser-restricted Maps key, optional valid Map ID, and Moyasar publishable key. Configure backend provider secrets and the correct HTTPS callback/webhook independently.
3. Resolve the message-only registration bootstrap contract. This frontend does not invent a generated user ID.
4. Perform a separately authorized runtime verification once desired; no such verification is claimed here.
5. Existing older frontend-integration documents contain historical 31-route/runtime reports. They are historical evidence only; this 61-route table is the current implementation coverage.

## Files added or changed

Added:

- `lib/api/discovery-contracts.ts`, `lib/api/discovery.ts`.
- `features/properties/search-form.tsx`, `search-page.tsx`, `hooks.ts`, `format.ts`, `property-card.tsx`, `skeletons.tsx`, `nearby-services.tsx`, `detail-page.tsx`.
- `features/payments/moyasar-form.tsx`, `commute-panel.tsx`, `payment-page.tsx`.
- `features/product/local-user.ts`, `interests.tsx`, `neighborhood.tsx`, `recommendations.tsx`, `comparison-listings.tsx`.
- `components/maps/maps-provider.tsx`, `google-map.tsx`; `components/product/route-error.tsx`, `page-skeleton.tsx`.
- Public route group layout, `/properties` search page, and `/properties/[source]/[externalId]` detail page.
- Product routes `/interests`, `/neighborhood`, `/payments`, `/payments/return`.
- Locale/public/product/auth error boundaries and locale not-found page.
- Loading boundaries: public search and detail; auth; product profile, dashboard, saved, compare and compare/[id], locations, interests, neighborhood, payments and payments/return, legacy properties/[id].
- This coverage report.

Changed:

- API client timeout, response contracts/validators, user-error normalization, existing endpoint write bodies, proxy route/query/idempotency forwarding.
- Local user storage helper, query provider (shared Maps provider and themed Sonner), IdentityGate, AuthForm, shared forms, profile/current-home controls, dashboard, locations map, saved details and comparison details.
- Product navigation, public header section-link destinations, landing discovery submission and accepted property types; existing Hero and other marketing sections are unchanged.
- `messages/ar.json`, `messages/en.json`, `.env.example`, `package.json`, `pnpm-lock.yaml`.
- Visual identity phase note and historical integration-document headers, which now point to this status.

The former `(product)/properties/page.tsx` route file was relocated to the public route group so `/properties` is available without an identity. `/saved` and existing numeric saved-detail URLs remain. No backend, font or image assets were modified. No existing test file was changed.

Final static check results: source-only TypeScript (temporary config excluding stale generated caches) completed with exit code 0; ESLint over the changed integration areas completed with exit code 0. These checks do not establish runtime API, browser, Maps, or payment success.
