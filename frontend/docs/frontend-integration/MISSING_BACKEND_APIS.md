# Missing backend APIs

The current development scope and exact proposed method/path/request/response contracts are
maintained in [PRODUCT_BACKEND_GAPS.md](PRODUCT_BACKEND_GAPS.md).

Verified absent from both the complete checked-in endpoint inventory and available Spring Boot
source: credential login, property search/detail/import, provider place lookup, route calculations,
property analysis, AI/recommendations and payment lifecycle APIs. The provider client beans do
not expose HTTP application operations. Registration exists but returns no created user ID.

These gaps do not disable current-home, housing-preference, important-location, profile,
saved-reference or comparison-pair workflows. All existing consumer operations have frontend UI.
The ID-based development flow is intentional; no token/session/cookie implementation is required
for this phase. Do not publish private test-account workflows as secure production access.

See [ENDPOINT_COVERAGE.md](ENDPOINT_COVERAGE.md) for all 31 implemented backend mappings,
per-operation frontend integration and the actual verification evidence.
