# Region-first discovery

The search form and landing search entry share `RegionSelector` and `CitySelector`.
The regional controls are frontend-only: select an administrative region, select
a documented city, then submit the existing filters. “All regions” clears the
regional and city selection; it never enables a nationwide search. A region
without documented cities shows an explicit unavailable-coverage explanation.

## Geography and provider coverage

`lib/property-regions.ts` separates the 13 administrative regions, city identity,
six visual identities, and documented search slugs. Its `supportedCities` lists
are derived from the city definitions, not maintained separately.

| Location | Administrative region | Visual identity | Search slug offered |
| --- | --- | --- | --- |
| الرياض / Riyadh | الرياض | Najdi clay | `riyadh` |
| جدة / Jeddah | مكة المكرمة | Coastal blue | `jeddah` |
| أبها / Abha | عسير | Highlands green | None: unverified |
| الأحساء / Al-Ahsa | الشرقية | Oasis | None: unverified |
| العلا / AlUla | المدينة المنورة | Rose stone | None: unverified |
| تبوك / Tabuk | تبوك | Northern stone | None: unverified |

`riyadh` and `jeddah` are documented in the complete public-search request
examples in `docs/FRONTEND_API_REFERENCE.md`. They have **not** been verified
against a live provider during this change. The provider remains authoritative
for actual availability and can reject a city. There is no documented city catalog
endpoint. No native slugs are guessed for the other locations, including Al-Kharj,
Diriyah, and Al-Majmaah. No coverage is claimed for the remaining seven regions;
their selection dots remain neutral instead of inventing brand assignments.

Each region is listed so geographic selection is not confused with provider
coverage. Lists currently have at most one supported city per region, so the
existing keyboard-accessible shadcn Select suffices without a separate search
box. Extend coverage only with documented or verified native slugs.

## Search behavior

- The existing parser, API client, query cache, loading/error handling, result
  deduplication, sort order and cursor pagination are unchanged.
- Forms send the city slug and existing documented filters. No `region` parameter
  is sent to the backend or added to the search schema.
- The selected city is stored in the existing URL search parameters. On browser
  back/forward or returning to that URL, the keyed search form restores the city
  and derives its region. Unsaved form edits retain the existing submit-to-search
  behavior and do not trigger requests.
- Selecting a different region clears an incompatible city and neighborhood ID.
  Changing filters clears the draft cursor; submitting never reuses a cursor.
  All existing advanced controls remain, using the shared shadcn Select.
- Valid pre-existing URLs for cities outside the curated list still pass through
  the existing API/provider validation. The form explains that the city is not
  listed and requires a documented selection before a new form submission.
  This preserves existing deep links without advertising unverified coverage.

## Card accents

Real property cards resolve their identity from `Property.city`, never the active
filter. Exact Arabic/English matches allow Unicode normalization, Arabic diacritics,
alef variants, whitespace/case, and explicit alternate spellings. There is no
substring, fuzzy, neighborhood-based or default-region inference. Unknown or
missing locations retain neutral cards.

Existing six semantic regional colors remain unchanged. A subtle border, colored
shadow and labeled region dot supplement the original card content and actions.
Theme variables reduce border/shadow intensity in dark mode. Hover elevation
and transitions respect reduced-motion preferences.

## Verification

Source-only TypeScript and targeted ESLint checks passed. No live provider calls,
browser rendering, tests, builds, commits, or pushes were performed. No backend,
API contract, authentication, dependency, or unrelated page changes were made.
