# MADAR implementation report

Implemented against the 31 controller mappings documented in this repository and confirmed in
`../Backend/src/main/java/com/example/madar`. Spring Boot source was not modified.
No packages were installed or reinitialized. No commit or push was made.

## 1. Product pages

Both `/ar` (default, RTL) and `/en` (LTR) provide:

- `/dashboard`: real user welcome, saved/place/pair counts, saved-reference cards and editable housing preferences.
- `/properties`: organize and locally search the actual saved shortlist, with a real reference-saving form.
- `/properties/[id]`: stored title, listing source and external reference; save/removal/comparison entry actions.
- `/saved`: persistent saved-reference creation, reading, deletion and comparison selection.
- `/locations`: optional location creation, reading, editing, removal and importance PATCH; free-text categories and actual manually supplied coordinates.
- `/compare`: select two saved references, persist a pair, display available reference facts in a semantic table, remove pairs.
- `/compare/[id]`: fetch an owned pair with the dedicated endpoint and update the selections.
- `/profile`: user read/update/delete; current-home and housing-preference create/read/update/delete.
- `/register`: real validated registration submission; message-only success accurately reports the missing ID.
- `/login`: validated email/password form and separately labelled local development account access. Credential verification is a backend gap.

These are functional reference-management workflows. They do not masquerade as live listing
search, imported listing details, price comparison, commute calculations or AI analysis.
The original marketing sections, images, animations, theme and brand are preserved. Entry CTAs
now lead to product routes, and obsolete disabled demonstration actions lead to supported workflows.

## 2. Development user identification

`lib/user-id.ts` stores **only** the ID under `madar_user_id`. The client guard reads storage after
hydration, fetches the corresponding real user, redirects when no ID exists, and clears an unknown
ID reported by the backend. A valid local development ID must be verified with the real user read
before entry. Logout cancels queries, clears the Query cache and stored ID, then preserves locale
while redirecting to login. No passwords are stored in localStorage.

Registration actually creates an account, but Spring Boot returns only `{message}`, so the
frontend cannot extract a user ID or enter the dashboard automatically. It never guesses an ID or
enumerates users. The email/password login form never accepts arbitrary credentials or calls an
invented route. A separate local test-ID form provides the explicitly requested development flow.
No JWT, token, cookie, session, NextAuth, OAuth or authentication middleware was added.

The server proxy retains the existing local/isolated environment gate and exact documented
method/path allowlist. It excludes admin/global reads. `API_BASE_URL` remains server-only.
This development flow is not secure authentication and is not exposed as a public production API.

## 3. API coverage

[ENDPOINT_COVERAGE.md](ENDPOINT_COVERAGE.md) accounts for every endpoint with request, response,
client, UI, status and runtime evidence:

- **31 documented mappings**, **25 consumer**, **6 internal**.
- **24 implemented and runtime verified consumer mappings**.
- **1 partially implemented consumer flow**: registration works, automatic entry lacks a returned ID.
- **6 internal mappings tested**: three global read array checks and three non-admin rejection checks.
- **0 existing mappings unaccounted for or unimplemented**. This is not 100% completion of the requested product.

Typed existing clients/hooks were reused. Account mutations and comparison-by-ID were added.
Only exact verified empty-response messages become null/empty collections; other errors remain
errors. All mutations refresh relevant Query keys. Shared forms strip non-input entity fields,
apply the documented constraints, translate validation/errors, map recognized server errors to
fields, prevent repeated submissions while pending, and show real success/error feedback.

## 4. Workshop migration

The obsolete `ProductStatus`, `AuthAvailability` and old two-item product navigation components
were removed. Existing endpoint clients and query hooks were preserved and connected to consumer
pages. `/workspace/*` and `/app` redirect to the dashboard; `/app/properties` redirects to properties;
`/sign-in` redirects to login. There are no endpoint/DTO controls or raw JSON panels in the product.

## 5. Functional workflows

- Register a real test account → see the accurate missing-ID result → enter using its known development ID → reload → retain account context → logout.
- Save two external listing references → view a saved reference → create a pair from actual saved data → fetch/edit/delete the persisted pair.
- Add a real-coordinate place → edit it → PATCH importance → delete it; adding locations remains optional.
- Edit profile → read persisted changes; create/edit/delete current home and housing preferences.
- Confirm account deletion → remove comparison pairs through documented endpoints because the backend has no comparison cascade → delete user → clear local identity.
- Fail the API connection → show localized retry/logout controls → restore connectivity → retry successfully.

## 6. UI improvements

A distinct application shell provides a dashboard logo link, active navigation, real profile
entry, logout, language/theme controls and a mobile Sheet. Empty states lead to supported forms.
Inputs, validation, errors, confirmation dialogs, skeletons, cards, badges and selections reuse
installed shadcn components. Comparison tables scroll within their container on mobile.
All new text exists in both next-intl message files. The supplied light/dark brand tokens remain.

## 7. Validation

Final results are recorded in [VERIFICATION_RESULTS.json](VERIFICATION_RESULTS.json).

- `pnpm lint`: passed.
- `pnpm typecheck`: passed.
- `MADAR_NEXT_DIST_DIR=.next-production-check pnpm build`: passed; all 51 generated entries, both locales and dynamic detail routes compiled.
- Live integration: **47 requests passed, all 31 mappings exercised**, with disposable records and cleanup. Consumer requests went through the final frontend proxy on port 3001. Admin checks cover rejection, not privileged success.
- Browser checks: **39 passed**, **371 captured API requests**, **54 screenshots** (48 product + 6 public pages). Arabic/English, RTL/LTR, light/dark and 1440/390px viewports passed with no horizontal overflow and no uncaught browser errors. Representative desktop, mobile, dark, marketing and login screenshots were visually inspected.
- Production smoke: compiled English login and Arabic marketing returned 200; API proxy returned the expected 404 and the development ID form was absent.
- Postman: the missing-user assertion passed (`400`, exact `User not found`). The CLI exited 1 for this negative response; it is not counted as an overall successful CLI run.

The initial sandbox build could not bind the CSS worker's port. A clean isolated output build
outside the sandbox passed. Port 3000 already had an older dev server, so verification used
port 3001 and `.next-verification` without stopping that process. ESLint excludes these generated
outputs. `instant = false` is scoped to client-selected account routes per the installed Next.js
guide, preventing inappropriate server instant-navigation validation of hidden account content.

No pre-existing automated test suite was present. Reusable checks were added without extra
browser packages:

```sh
# Standard frontend on port 3000, backend on localhost:8080:
pnpm test:api
# Separate headless Chrome must be listening on debugging port 9222:
pnpm test:browser

# To reproduce against an isolated frontend on port 3001:
MADAR_TEST_BASE_URL=http://127.0.0.1:3001/api/backend pnpm test:api
MADAR_TEST_FRONTEND_URL=http://127.0.0.1:3001 pnpm test:browser
```

The live test bootstrap does a read-only local MySQL SELECT for its freshly created disposable
account ID, because registration omits it. This test-only database lookup is never used by the
product and does not verify automatic registration entry. It requires the existing XAMPP mysql
client and the local backend properties file; there is no account enumeration in the browser.
Browser screenshot artifacts are under `/tmp/madar-browser/`; HTTP evidence under
`/tmp/madar-runtime-results.json`. No AI/payment/provider calls or notifications were triggered.

## 8. Confirmed backend gaps

- Registration omits the actual created user ID.
- No email/password login endpoint.
- No property search/filter/pagination, live detail or external URL import endpoint.
- No Google Places lookup or Google Routes calculation endpoint.
- No real comparison analysis, AI/recommendation or payment lifecycle endpoint.

Client beans alone do not expose these capabilities. Exact proposed method/path/request/response
contracts and source evidence are in [PRODUCT_BACKEND_GAPS.md](PRODUCT_BACKEND_GAPS.md).

## 9. Remaining work

Backend work is required to return the registration user, verify login credentials, and define
normalized listing/import/Places/Routes/analysis APIs before those requested journeys can work.
Once contracts exist, replace reference-only views with resolved listing content and run the
same live/browser checks against those operations. Real authentication remains the user's later
Spring Security phase. This frontend has not introduced it or modified backend code.
