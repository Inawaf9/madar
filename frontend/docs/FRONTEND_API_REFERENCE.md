# MADAR Frontend API Reference

Source audit date: 2026-10-21. This is a reference to the checked-out Spring Boot implementation, including existing uncommitted work, for a Next.js developer without access to the backend. It describes implemented behavior, not proposed API design. **No application, tests, provider requests, or runtime verification were performed for this audit.**

## Table of contents

1. [Scope, transport, and access](#scope-transport-and-access)
2. [Master endpoint inventory](#master-endpoint-inventory)
3. [Shared responses and errors](#shared-responses-and-errors)
4. [DTO and TypeScript reference](#dto-and-typescript-reference)
5. [Public property search contract](#public-property-search-contract)
6. [Detailed endpoint contracts](#detailed-endpoint-contracts)
7. [Geographic search and essentials](#geographic-search-and-essentials)
8. [Payments and the paid commute flow](#payments-and-the-paid-commute-flow)
9. [Frontend Feature → Backend Endpoint Mapping](#frontend-feature--backend-endpoint-mapping)
10. [Integration risks and missing capabilities](#integration-risks-and-missing-capabilities)
11. [Source coverage and internal DTOs](#source-coverage-and-internal-dtos)

## Scope, transport, and access

The application uses Spring MVC controllers → services → JPA repositories, with Lombok entity/DTO classes and several Java record responses. Listings are fetched live through the existing Kite client; saved properties and comparisons persist references rather than a local listing inventory. Google Places supplies neighborhood discovery; Google Routes supplies paid driving reports; Moyasar supplies Payment Intents and canonical payment verification.

There are **61 declared method/path operations in 9 REST controllers**: **36 CRUD and 25 custom business operations**. CRUD here means create/read/update/delete of a stored resource or a single property detail. Searches, counts/statistics, recommendations, geographic discovery, move confirmation, commute calculations, and the payment lifecycle are custom. This definition classifies the payment-history/access reads as part of the custom payment lifecycle. Implicit Spring HEAD/OPTIONS and framework error handling are not additional declared application endpoints. No mapped interface/inherited endpoints were found.

Use a deployment-supplied backend origin, e.g. `BACKEND_ORIGIN + /api/v1/...`. No explicit application HTTP port or servlet context prefix was found; ordinary Spring Boot defaults would be port 8080 and root context unless deployment overrides them. Do not assume a production hostname or put provider secret credentials in a Next.js public environment variable. JSON bodies use `Content-Type: application/json`; read endpoints have no body unless explicitly stated.

### Access classes

| Class | Meaning in this document | Actual protection |
|---|---|---|
| A — Public discovery / public entry | Does not depend on a stored user or saved personal data. Includes anonymous registration as an account-entry exception to discovery. | No user authentication required or implemented. |
| B — User-scoped | Needs an existing local user ID or a record owned by that supplied ID; some endpoints additionally require setup or a paid pass. | Domain existence/ownership checks only. **An ID in a URL is not authentication.** |
| C — Provider callback | Moyasar webhook. | Provider body-secret validation and canonical provider re-fetch; not a frontend route. |
| D — Internal / administrative | Global dataset reads or explicitly named admin routes. | Global reads have no guard; user admin routes check the stored role of a supplied adminId, without binding that ID to a trusted caller. |

Current inventory by access class: A=12, B=42, C=1, D=6. Classification follows actual data dependencies, not whether a route is technically callable.

There are no Spring Security/JWT/session filters or actual caller authentication/authorization in this checkout. Every user-scoped route is vulnerable to impersonation until that is added separately. Do not describe these routes as authenticated, or use frontend route guards as evidence of backend protection. Do not expose global administrative reads in public UI.

No application CORS configuration or `@CrossOrigin` was found. A browser on a separate Next.js origin may fail cross-origin requests/preflights depending on deployment. An existing same-origin Next.js server proxy/BFF can call the backend without browser CORS; this document does not implement one or claim deployment permits cross-origin requests.

### Identifiers and dates

- `userId`, `adminId`, `homeId`, `preferenceId`, `placeId` (commute record), `interestId`, `savedPropertyId`, `comparisonId`, and local `paymentId` are Java Integer IDs, JSON numbers. These are different from provider identifiers.
- A Kite property `externalId` is a string in MADAR, even though Kite's internal listing ID is a Long. Preserve it as a string in URLs and saved references.
- Google place IDs are strings. Moyasar intent/payment IDs and the checkout `givenId` are provider strings; the local payment ID remains numeric.
- LocalDate is expected to serialize as `YYYY-MM-DD`; LocalDateTime as an ISO local timestamp without a zone; OffsetDateTime includes an offset. These follow the standard Boot/Jackson behavior; no custom date/time format or global timezone configuration was found and wire behavior was not executed. Do not append `Z` to server-local timestamps or silently assume UTC.
- Integer/Long/Double/BigDecimal serialize as JSON numbers. Prices in property search are **SAR**, checkout amounts are integer **halalas**. Decimal/large integer values may lose precision in JavaScript; there is no custom decimal-string serializer.

All JSON examples below are **illustrative shapes**, not captured traffic or real listings/businesses/payment data. Strings such as `<external-id>`, `<user-entered compliant password>`, and `<redacted>` are placeholders, not values to send literally. Numeric IDs and coordinates are examples, not assertions that records exist. Referenced DTO contracts define nullability and constraints; a sample value does not make a nullable field mandatory.


## Master endpoint inventory

Every route below is declared in source. No proposed or missing routes are counted. The **Controller.method** column also identifies the module implementation; complete contracts follow later.

| Module / controller | Total | CRUD | Custom |
|---|---:|---:|---:|
| Properties: public and personalized discovery / `PropertyController` | 13 | 1 | 12 |
| Users and administrative user operations / `UserController` | 7 | 7 | 0 |
| Housing preferences / `HousingPreferenceController` | 6 | 5 | 1 |
| Commute destinations and public nearby services / `PlacePreferenceController` | 7 | 5 | 2 |
| Essential interests / `EssentialInterestController` | 4 | 4 | 0 |
| Current home and neighborhood / `CurrentHomeController` | 10 | 5 | 5 |
| Saved properties / `SavedPropertyController` | 3 | 3 | 0 |
| Property comparisons / `PropertyComparisonController` | 6 | 6 | 0 |
| Payments and access / `PaymentController` | 5 | 0 | 5 |
| **Total** | **61** | **36** | **25** |

| # | Method and complete path | Controller.method | Class | Kind | Purpose |
|---:|---|---|---|---|---|
| 1 | `GET /api/v1/properties/search` | `PropertyController.searchPublic` | A | CUSTOM | Public discovery with native Kite filters and cursors |
| 2 | `GET /api/v1/properties/search/{city}/{listingType}/{propertyType}/{maxPrice}` | `PropertyController.search` | A | CUSTOM | Legacy residential search |
| 3 | `GET /api/v1/properties/get/{source}/{externalId}` | `PropertyController.getPropertyById` | A | CRUD | Public listing details |
| 4 | `GET /api/v1/properties/by-preferences/{userId}` | `PropertyController.getByPreferences` | B | CUSTOM | Listings matching saved housing preferences |
| 5 | `GET /api/v1/properties/near-location/{city}/{listingType}/{propertyType}/{latitude}/{longitude}/{radiusKm}` | `PropertyController.getNearLocation` | A | CUSTOM | Legacy property discovery around coordinates |
| 6 | `GET /api/v1/properties/within-budget/{userId}` | `PropertyController.getWithinBudget` | B | CUSTOM | Listings within a user's saved budget |
| 7 | `GET /api/v1/properties/under-budget-margin/{userId}/{margin}` | `PropertyController.getUnderBudgetMargin` | B | CUSTOM | Listings below saved budget by a SAR margin |
| 8 | `GET /api/v1/properties/by-districts/{city}/{listingType}/{propertyType}/{districts}` | `PropertyController.getByDistricts` | A | CUSTOM | Legacy search in several named districts |
| 9 | `GET /api/v1/properties/price-range/{city}/{listingType}/{propertyType}/{minPrice}/{maxPrice}` | `PropertyController.getByPriceRange` | A | CUSTOM | Legacy property price range search |
| 10 | `GET /api/v1/properties/sort/{city}/{listingType}/{sortBy}` | `PropertyController.sortProperties` | A | CUSTOM | Legacy sorted residential discovery |
| 11 | `GET /api/v1/properties/price-stats/{city}/{listingType}/{propertyType}` | `PropertyController.getPriceStats` | A | CUSTOM | Asking-price extrema and count |
| 12 | `GET /api/v1/properties/results-count/{city}/{listingType}` | `PropertyController.getResultsCount` | A | CUSTOM | Legacy unfiltered-by-type listing count |
| 13 | `GET /api/v1/properties/similar/{source}/{externalId}` | `PropertyController.getSimilar` | A | CUSTOM | Price-band similarity candidates |
| 14 | `POST /api/v1/user/register` | `UserController.register` | A | CRUD | Register a user record |
| 15 | `GET /api/v1/user/get/{userId}` | `UserController.getMyAccount` | B | CRUD | Read a user profile |
| 16 | `PUT /api/v1/user/update/{userId}` | `UserController.updateMyAccount` | B | CRUD | Replace user profile fields |
| 17 | `DELETE /api/v1/user/delete/{userId}` | `UserController.deleteMyAccount` | B | CRUD | Delete a user and cascaded data |
| 18 | `GET /api/v1/user/admin/get-all/{adminId}` | `UserController.getAllUsers` | D | CRUD | Administrative user listing |
| 19 | `PUT /api/v1/user/admin/update/{adminId}/{userId}` | `UserController.adminUpdateUser` | D | CRUD | Administrative user update |
| 20 | `DELETE /api/v1/user/admin/delete/{adminId}/{userId}` | `UserController.adminDeleteUser` | D | CRUD | Administrative user deletion |
| 21 | `GET /api/v1/housing-preference/get` | `HousingPreferenceController.getAllHousingPreferences` | D | CRUD | Global housing-preference listing |
| 22 | `GET /api/v1/housing-preference/get-by-user/{userId}` | `HousingPreferenceController.getHousingPreferenceByUserId` | B | CRUD | Read a user's housing preference |
| 23 | `POST /api/v1/housing-preference/add/{userId}` | `HousingPreferenceController.addHousingPreference` | B | CRUD | Create housing preference |
| 24 | `PUT /api/v1/housing-preference/update/{userId}/{preferenceId}` | `HousingPreferenceController.updateHousingPreference` | B | CRUD | Replace housing preference |
| 25 | `DELETE /api/v1/housing-preference/delete/{userId}/{preferenceId}` | `HousingPreferenceController.deleteHousingPreference` | B | CRUD | Delete housing preference |
| 26 | `GET /api/v1/housing-preference/match-summary/{userId}` | `HousingPreferenceController.getMatchSummary` | B | CUSTOM | Saved-preference market summary |
| 27 | `GET /api/v1/place-preference/get/{userId}` | `PlacePreferenceController.getMyPlaces` | B | CRUD | List saved commute destinations |
| 28 | `POST /api/v1/place-preference/add/{userId}` | `PlacePreferenceController.addPlace` | B | CRUD | Add a fixed commute destination |
| 29 | `PUT /api/v1/place-preference/update/{userId}/{placeId}` | `PlacePreferenceController.updatePlace` | B | CRUD | Replace commute destination |
| 30 | `DELETE /api/v1/place-preference/delete/{userId}/{placeId}` | `PlacePreferenceController.deletePlace` | B | CRUD | Delete commute destination |
| 31 | `PATCH /api/v1/place-preference/importance/{userId}/{placeId}/{importance}` | `PlacePreferenceController.updateImportance` | B | CRUD | Update destination importance only |
| 32 | `GET /api/v1/place-preference/calculate-commutes/{userId}` | `PlacePreferenceController.calculateCommutes` | B | CUSTOM | Paid personalized driving commute analysis |
| 33 | `GET /api/v1/place-preference/nearby-services` | `PlacePreferenceController.getNearbyServices` | A | CUSTOM | Public category-based nearby places |
| 34 | `GET /api/v1/essential-interest/get/{userId}` | `EssentialInterestController.getMyInterests` | B | CRUD | List user-defined essential interests |
| 35 | `POST /api/v1/essential-interest/add/{userId}` | `EssentialInterestController.addInterest` | B | CRUD | Add an essential interest |
| 36 | `PUT /api/v1/essential-interest/update/{userId}/{interestId}` | `EssentialInterestController.updateInterest` | B | CRUD | Replace an essential interest |
| 37 | `DELETE /api/v1/essential-interest/delete/{userId}/{interestId}` | `EssentialInterestController.deleteInterest` | B | CRUD | Delete an essential interest |
| 38 | `GET /api/v1/current-home/get` | `CurrentHomeController.getAllCurrentHomes` | D | CRUD | Global current-home listing |
| 39 | `GET /api/v1/current-home/get-by-user/{userId}` | `CurrentHomeController.getCurrentHomeByUserId` | B | CRUD | Read user's single current home |
| 40 | `POST /api/v1/current-home/add/{userId}` | `CurrentHomeController.addCurrentHome` | B | CRUD | Create user's current home |
| 41 | `PUT /api/v1/current-home/update/{userId}/{homeId}` | `CurrentHomeController.updateCurrentHome` | B | CRUD | Replace current-home data |
| 42 | `DELETE /api/v1/current-home/delete/{userId}/{homeId}` | `CurrentHomeController.deleteCurrentHome` | B | CRUD | Delete current home |
| 43 | `POST /api/v1/current-home/{userId}/confirm-move` | `CurrentHomeController.confirmMove` | B | CUSTOM | Confirm physical move using stored home date |
| 44 | `GET /api/v1/current-home/{userId}/neighborhood` | `CurrentHomeController.getNeighborhood` | B | CUSTOM | Confirmed-home neighborhood overview |
| 45 | `GET /api/v1/current-home/{userId}/nearby-by-category` | `CurrentHomeController.getNearbyByCategory` | B | CUSTOM | Category search around confirmed home |
| 46 | `GET /api/v1/current-home/{userId}/nearest-essential` | `CurrentHomeController.getNearestEssential` | B | CUSTOM | Nearest candidates for user's own essentials |
| 47 | `GET /api/v1/current-home/{userId}/nearby-search` | `CurrentHomeController.searchNearby` | B | CUSTOM | Free-text place search around confirmed home |
| 48 | `GET /api/v1/saved-property/get/{userId}` | `SavedPropertyController.getMySavedProperty` | B | CRUD | Read saved property references |
| 49 | `POST /api/v1/saved-property/add/{userId}` | `SavedPropertyController.addSavedProperty` | B | CRUD | Save a listing reference |
| 50 | `DELETE /api/v1/saved-property/delete/{userId}/{savedPropertyId}` | `SavedPropertyController.deleteSavedProperty` | B | CRUD | Remove a saved reference |
| 51 | `GET /api/v1/property-comparison/get` | `PropertyComparisonController.getAllComparisons` | D | CRUD | Global comparison-reference listing |
| 52 | `GET /api/v1/property-comparison/get-by-user/{userId}` | `PropertyComparisonController.getComparisonsByUserId` | B | CRUD | List comparison references for user |
| 53 | `GET /api/v1/property-comparison/get-by-id/{userId}/{comparisonId}` | `PropertyComparisonController.getComparisonById` | B | CRUD | Read one user-owned comparison |
| 54 | `POST /api/v1/property-comparison/add/{userId}` | `PropertyComparisonController.addComparison` | B | CRUD | Save a pair of property references |
| 55 | `PUT /api/v1/property-comparison/update/{userId}/{comparisonId}` | `PropertyComparisonController.updateComparison` | B | CRUD | Replace a saved comparison pair |
| 56 | `DELETE /api/v1/property-comparison/delete/{userId}/{comparisonId}` | `PropertyComparisonController.deleteComparison` | B | CRUD | Delete saved comparison |
| 57 | `POST /api/v1/payments/{userId}/checkout` | `PaymentController.checkout` | B | CUSTOM | Create or resume server-priced checkout |
| 58 | `GET /api/v1/payments/{userId}/{paymentId}/verify` | `PaymentController.verify` | B | CUSTOM | Authoritatively verify and synchronize payment |
| 59 | `POST /api/v1/payments/webhook` | `PaymentController.webhook` | C | CUSTOM | Receive authentic provider payment notifications |
| 60 | `GET /api/v1/payments/{userId}` | `PaymentController.getHistory` | B | CUSTOM | Read user payment history |
| 61 | `GET /api/v1/payments/{userId}/access/{serviceType}` | `PaymentController.getAccess` | B | CUSTOM | Read paid-feature entitlement |


## Shared responses and errors

There is **no universal success envelope**. Responses may be raw objects, arrays, a bare number, `{ "message": "..." }`, or the public-search `{data,pagination}` object. Do not write an API client that always unwraps `response.data`. The detailed contracts specify each actual type and success code.

Mutation responses use the exact controller message shown in each contract. They ordinarily return **no generated ID or updated record**. Refetch the relevant GET after success. Creates inconsistently use 200 or 201; deletes return 200 with a message rather than 204.

### Error handling actually declared in AdviceController

| Error source | Status | Body / frontend implication |
|---|---:|---|
| ApiException (missing records, setup, ownership, most provider errors) | 400 | `{"message":"<exception message>"}`. Missing resources are frequently **not 404**. |
| ResponseStatusException | Preserves exception status | `{"message":"<reason>"}`; reason can be null. Payments and new public search use meaningful 401/402/404/409/429/502/503 as described per endpoint. |
| Bean validation / binding validation | 400 | MethodArgumentNotValidException returns the first field error's default message in ApiResponse; constraint violations use the exception message. No structured field-error array or stable ordering. |
| Type mismatch / unreadable JSON | 400 | ApiResponse; numeric conversion and malformed bodies are not successful empty results. |
| Unsupported HTTP method | 400 | ApiResponse rather than a guaranteed 405. |
| Data integrity / SQL / generic RuntimeException | 400 | ApiResponse; may contain technical exception messages. 400 does not always mean a user-correctable field error. |
| NoResourceFoundException / unsupported media type / missing path variable handler | 400 | Raw string response from those handlers, not an ApiResponse object. |
| Missing required query parameter or request header | Framework-dependent | No dedicated handler was found for every such exception. Do not assert the exact body or status without runtime evidence; standard MVC may return 400 with a different body. |

Example domain error shape:

```json
{"message":"User not found"}
```

Messages differ across services, e.g. an empty destination list uses `No places found for this user`, and an empty saved-property list uses `No saved properties found for this user`. Capture status plus safely parsed body/text. Avoid treating every 400 as “no records.” Payments may return 402 when access is absent. An HTTP200 nearest-essential response can still contain `SEARCH_FAILED` items.

The UI should keep independent states for loading, empty data, missing prerequisite setup, validation, revoked/expired access, rate limiting, and provider/network errors. No endpoint promises a normalized error code enum, request ID, pagination totals, or retry timestamp unless explicitly documented below.


## DTO and TypeScript reference

Names ending in `Write` or `Response` for JPA resources below are **documentation aliases**, not additional Java DTO files. Controllers bind/return the actual entity class. All response properties listed are its serialized scalar properties unless noted. Requests should contain only the writable form fields below; omit generated IDs, timestamps, user objects, and relationship sets even where raw entity binding could accept additional properties. Unknown-property behavior is not uniformly constrained for entity requests.

`?` means a request property may be omitted. `| null` represents accepted/possible JSON null, not an invitation to discard required setup. Provider DTOs are conservatively nullable because the upstream can omit data; client validation narrows some fields for public search and mapped nearby results.

### Shared scalar and entity types

```ts
type LocalDateString = string;      // YYYY-MM-DD
type LocalDateTimeString = string;  // no offset in Java LocalDateTime
type OffsetDateTimeString = string;
type ListingPurpose = "rent" | "sale";
type ResidentialType = "apartment" | "villa" | "floor" | "duplex" | "building";
type PublicPropertyType = ResidentialType | "office" | "shop" | "warehouse" | "land";
type NearbyCategory = "supermarket" | "hospital" | "pharmacy" | "park" |
  "gym" | "cafe" | "restaurant" | "school" | "shopping_mall";
type InterestSearchMode = "CATEGORY" | "TEXT";
type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
type PaidServiceType = "COMMUTE_REPORT";

interface ApiResponse { message: string | null; }

interface UserWrite {
  fullName: string;
  email: string;
  password: string;
}
interface UserResponse {
  id: number;
  fullName: string;
  email: string;
  createdAt: LocalDateTimeString | null;
}

interface HousingPreferenceWrite {
  region: string;
  city: string;
  district?: string | null;
  maxBudget: number;
  propertyType: ResidentialType;
  listingType: ListingPurpose;
}
interface HousingPreferenceResponse {
  id: number;
  region: string;
  city: string;
  district: string | null;
  maxBudget: number;
  propertyType: ResidentialType;
  listingType: ListingPurpose;
  user: UserResponse; // unlike most entities, this relation is not JsonIgnore
}

interface PlacePreferenceWrite {
  name: string;
  type: string; // arbitrary destination label, not NearbyCategory
  latitude: number;
  longitude: number;
  importance: number;
  visitPerWeek: number;
}
interface PlacePreferenceResponse extends PlacePreferenceWrite { id: number; }

interface EssentialInterestWrite {
  name: string;
  searchTerm: string;
  searchMode?: InterestSearchMode; // omitted => TEXT; explicit null invalid
  priority?: number | null;
}
interface EssentialInterestResponse {
  id: number;
  name: string;
  searchTerm: string;
  searchMode: InterestSearchMode;
  priority: number | null;
}

interface CurrentHomeWrite {
  latitude: number;
  longitude: number;
  externalPropertyId?: string | null;
  source?: string | null;
  movedInAt?: LocalDateString | null;
}
interface CurrentHomeResponse {
  id: number;
  latitude: number;
  longitude: number;
  externalPropertyId: string | null;
  source: string | null;
  movedInAt: LocalDateString | null;
  confirmedByUserAt: LocalDateTimeString;
}

interface SavedPropertyWrite {
  externalPropertyId: string;
  source: string;
  titleSnapshot?: string | null;
}
interface SavedPropertyResponse {
  id: number;
  externalPropertyId: string;
  source: string;
  titleSnapshot: string | null;
  savedAt: LocalDateTimeString;
}

interface PropertyComparisonWrite {
  firstPropertyId: string;
  secondPropertyId: string;
  firstPropertySource: string;
  secondPropertySource: string;
}
interface PropertyComparisonResponse extends PropertyComparisonWrite {
  id: number;
  createdAt: LocalDateTimeString;
}
```

### Form validation and serialization rules

| Form / source | Required and accepted fields | Validation / important omissions |
|---|---|---|
| User / UserWrite | fullName, email, password | fullName NotEmpty, length 3–100; email NotEmpty + Email (DB varchar100); password NotEmpty, 8–64 chars, uppercase + lowercase + digit + non-alphanumeric non-whitespace character, no whitespace. Same rules apply to full PUT, including password. |
| HousingPreference | region, city, maxBudget, propertyType, listingType | region NotEmpty (DB100); city regex `^[a-z-]+$`; district nullable max100; maxBudget >=1, BigDecimal precision12/scale2 in DB; type five lowercase residential values; purpose lowercase rent/sale. Region is not a search filter in recommendation code. |
| PlacePreference | name, type, latitude, longitude, importance, visitPerWeek | name/type NotEmpty (DB100/50); lat [-90,90], lng [-180,180], required; importance integer1–5; visitPerWeek required integer **without a Min constraint on CRUD**. Paid analysis/checkout apply additional usable-destination checks. |
| EssentialInterest | name, searchTerm; mode defaults TEXT; priority optional | name NotBlank max100; searchTerm NotBlank max500; searchMode NotBlank and exact CATEGORY/TEXT; priority nullable integer1–5. Search term never needs to match a predefined type. |
| CurrentHome | latitude, longitude | Required bounded coordinates as above. externalPropertyId DB150, source DB50, both nullable. movedInAt nullable LocalDate, no past/future constraint. DB lengths are not equivalent to bean-validation annotations. |
| SavedProperty | externalPropertyId, source | NotEmpty (DB150/50); titleSnapshot nullable (DB200). Source uppercased on create. Listing existence/source support is not verified. |
| PropertyComparison | firstPropertyId, secondPropertyId, firstPropertySource, secondPropertySource | NotEmpty; IDs DB150/sources DB50. Same-reference and duplicate-pair rules enforced in service, case-sensitive. |
| CheckoutRequestDTO | serviceType | NotEmpty max50; service resolves after trim/uppercase, only COMMUTE_REPORT. No amount, currency, status or card fields. |

Password regex in User is `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9\s])\S{8,64}$`. Password is Jackson WRITE_ONLY and excluded from responses. Role and all User relationship fields are JsonIgnore. Role USER is assigned on registration; supplying role does not establish an administrator. Related resources normally ignore their user relation, **except HousingPreference**, which includes the safe scalar user profile. There are no Java enum types for many of these fields: patterns and service string checks enforce the documented accepted values.

`@NotEmpty` differs from `@NotBlank`; do not assume older form fields reject whitespace-only values the same way interests do. Column lengths are database constraints unless a separate Size annotation is listed.

### Property search and property DTOs

```ts
type PublicSort =
  | "newest" | "updated_desc" | "updated_asc" | "price_asc" | "price_desc"
  | "price_drop" | "days_on_market_desc" | "recommended"
  | "price" | "price-desc" | "price-drop"; // supported compatibility aliases

interface PropertySearchRequestDTO { // query parameters, NOT a JSON body
  city: string;
  purpose?: ListingPurpose; // default rent
  q?: string;
  type?: PublicPropertyType | "all"; // effective default all
  neighborhoodId?: number;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  minBedrooms?: number;
  minBathrooms?: number;
  furnished?: "true" | "false"; // Java String, query literal
  rentFrequency?: "monthly" | "yearly";
  sort?: PublicSort; // default newest
  limit?: number; // default 20
  cursor?: string;
}
interface PropertyDTO {
  externalId: string | null;
  source: string; // mapper sets KITE
  sourceName: string | null;
  title: string | null;
  listingUrl: string | null;
  city: string | null;
  neighborhood: string | null;
  propertyType: string | null;
  listingType: string | null;
  price: number | null; // SAR: yearly rent or sale amount
  bedrooms: number | null;
  areaSqm: number | null;
  latitude: number | null;
  longitude: number | null;
  image: string | null;
  updatedAt: string | null; // raw provider timestamp string
  distanceKm: number | null; // only set by legacy near-location
  description: string | null;
  bathrooms: number | null;
  pricePeriod: "yearly" | "total" | null;
  postedPrice: number | null; // Java Long
  postedPricePeriod: string | null; // raw upstream frequency
  sourceUrl: string | null;
  images: string[] | null; // [] on public mapper if missing; null on legacy mapper
  neighborhoodId: number | null;
}
interface PropertySearchResponseDTO {
  data: PropertyDTO[];
  pagination: {
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
    resultWindowReached: boolean;
  };
}
interface PriceStatsDTO {
  city: string;
  listingType: string;
  propertyType: string;
  totalListings: number;
  minPrice: number | null;
  maxPrice: number | null;
}
interface MatchSummaryDTO {
  budget: number;
  totalListings: number;
  inMyDistrict: number | null;
  cheapestPrice: number | null;
}
```

The public mapper used by query search and details sets `source="KITE"`, prefers nonblank provider title then headline, keeps description, source attribution, original URL and posted amount/frequency, filters null image entries, and picks the first usable image. Null provider data stays null; there is no invented title, district, price or image. Older property methods use a smaller mapper, so the newer appended fields may be null. Do not require these fields on a legacy recommendation card. Legacy String.valueOf on a missing numeric listing ID can yield the literal `"null"`; do not open/save that as a valid listing ID.

### Google Places, neighborhood, essentials, and driving DTOs

```ts
interface GoogleLocation {
  latitude: number | null;
  longitude: number | null;
}
interface GoogleDisplayName { text: string | null; }
interface GooglePlace {
  id: string | null;
  displayName: GoogleDisplayName | null;
  formattedAddress: string | null;
  location: GoogleLocation | null;
  primaryType: string | null;
  types: string[] | null;
}
interface GooglePlacesResponseDTO {
  places: (GooglePlace | null)[] | null; // raw category DTO is not normalized uniformly
}
interface NearbyPlaceResponseDTO {
  place: GooglePlace;
  straightLineDistanceMeters: number;
}
interface CategorySummary {
  category: string;
  returnedCount: number;
  placeIds: string[];
}
interface NeighborhoodResponseDTO {
  homeId: number;
  location: GoogleLocation; // successful overview has valid coordinates
  radiusMeters: number; // currently fixed 2000
  places: GooglePlace[];
  categories: CategorySummary[];
  completeInventory: boolean; // implementation always false
}
interface NearestEssentialResponseDTO {
  interest: EssentialInterestResponse;
  searchMethod: "NEARBY" | "TEXT";
  status: "FOUND" | "NO_MATCH" | "SEARCH_FAILED";
  found: boolean;
  place: GooglePlace | null;
  straightLineDistanceMeters: number | null;
}
interface CommuteResponseDTO {
  placePreferenceId: number;
  placeName: string;
  placeType: string;
  importance: number;
  visitPerWeek: number;
  distanceKm: number;
  durationMinutes: number;
}
interface CommuteSummaryResponseDTO {
  commutes: CommuteResponseDTO[];
  totalWeeklyMinutes: number;
  totalWeeklyHours: number;
  commuteScore: number;
}
```

GooglePlace is the nested `GooglePlacesResponseDTO.Place`; GoogleDisplayName/GoogleLocation are the nested records. A nearest-essential FOUND item has found=true, place and straight-line distance populated; NO_MATCH/SEARCH_FAILED have found=false and null place/distance. These are per-interest results, not HTTP error codes. Category discovery does not return distance values; never reinterpret Google result order as a measured travel duration.

### Payment DTOs

```ts
interface CheckoutRequestDTO { serviceType: string; }
interface CheckoutResponseDTO {
  paymentId: number;
  serviceType: string;
  amount: number; // integer halalas
  currency: string; // SAR for the supported service
  intentId: string;
  clientSecret: string; // sensitive checkout-scoped provider material; never log/persist publicly
  expiresAt: OffsetDateTimeString;
  givenId: string; // UUID frontend must pass to provider as given_id
  metadata: Record<string, string>; // madar_payment_id, user_id, service_type
}
interface PaymentResponseDTO {
  id: number;
  serviceType: string;
  amount: number;
  currency: string | null; // legacy records can lack trusted checkout data
  status: PaymentStatus;
  createdAt: LocalDateTimeString;
  paidAt: LocalDateTimeString | null;
  accessExpiresAt: LocalDateTimeString | null;
  refundedAmount: number | null;
}
interface FeatureAccessResponseDTO {
  serviceType: string;
  access: boolean;
  expiresAt: LocalDateTimeString | null;
}
// Provider input only; never construct/call this from browser UI.
interface MoyasarWebhookDTO {
  id?: string | null;
  type?: string | null;
  secret_token?: string | null; // body field; write-only in Java
  data?: { id?: string | null; description?: string | null } | null;
}
```

Webhook DTO properties are syntactically nullable/unannotated; service validation still requires the configured matching secret, event id/type and relevant payment fields. Extra provider fields are ignored. Checkout responses intentionally contain clientSecret in JSON even though the Java toString redacts it; redaction of toString is **not** a JSON serialization rule. Never include a real checkout client secret in logs, shared examples or analytics. PaymentResponseDTO excludes secret keys, card details, provider payloads, intent client secrets and internal reconciliation fields.


## Public property search contract

### Primary route and independence

`GET /api/v1/properties/search` → `PropertyController.searchPublic` → `PropertyService.searchPublic` → existing `KiteClient.discoverListings` → provider `GET /listings`.

This flow does not look up a user, housing preferences, destinations, essential interests, or local listings. **city is mandatory**. A request containing city alone is the default rental discovery feed, not a nationwide search. There is no backend-selected default city, multi-city aggregation, page-number abstraction, or full-inventory in-memory filtering. All other filters are optional.

### Query parameters and native Kite mapping

Query names and enum literals below are case-sensitive for this endpoint. Omit unused parameters entirely; do not send `undefined`, `null`, empty strings, repeated keys or unknown keys.

| MADAR parameter | Type | Required | Default when omitted | Accepted values / validation | Kite parameter |
|---|---|---|---|---|---|
| city | string | **Yes** | None | Nonblank native city slug, regex `^[a-z_]+$`. Syntax is checked locally; provider validates actual city support. | city |
| purpose | string | No | rent | rent or sale; nonblank | listing_type |
| q | string | No | None | 2–120 characters, not blank; sent to provider as supplied | q |
| type | string | No | all | all, apartment, villa, floor, duplex, building, office, shop, warehouse, land | property_type; omitted for all |
| neighborhoodId | integer | No | None | >=1; provider validates city/reference compatibility | neighborhood_id |
| minPrice | integer | No | None | 0–2,000,000,000 SAR; <=maxPrice if both set | price_min |
| maxPrice | integer | No | None | 0–2,000,000,000 SAR; >=minPrice if both set | price_max |
| minArea | finite number | No | None | 0–10,000,000 square meters; <=maxArea | area_min |
| maxArea | finite number | No | None | 0–10,000,000 square meters; >=minArea | area_max |
| minBedrooms | integer | No | None | 0–20 | beds_min |
| minBathrooms | integer | No | None | 0–20 | bathrooms_min |
| furnished | string literal | No | None | exactly true or false | furnished |
| rentFrequency | string | No | None | monthly or yearly; not allowed when purpose=sale | rent_frequency |
| sort | string | No | newest | Native values and aliases below | sort, alias normalized |
| limit | integer | No | 20 | 1–100 locally; provider subscription/plan may impose a lower cap | limit |
| cursor | opaque string | No | None | Nonblank, maximum500 characters; use provider value unchanged | cursor |

The controller examines the complete query MultiValueMap and rejects duplicate, unknown and blank values, in addition to model validation. This strict unknown-key behavior is specific to this public-search handler; it is not a documented global policy. A query with no city fails rather than falling back to Riyadh. There is no region, district-name, bounding-box, maximum-bedrooms/bathrooms, or page/offset query parameter on this route.

Native sorting values: `newest`, `updated_desc`, `updated_asc`, `price_asc`, `price_desc`, `price_drop`, `days_on_market_desc`, `recommended`. Compatibility aliases: `price` → `price_asc`, `price-desc` → `price_desc`, `price-drop` → `price_drop`. Sort order comes from Kite and is not re-sorted locally. `recommended` is a provider sort, not MADAR's user-personalization pipeline. No extra tie-break key or snapshot-consistency guarantee is implemented in MADAR.

### Free-text and rental semantics

q is delegated to Kite's native search, not filtered over one returned page. The existing integration documentation describes keyword search over provider listing text; MADAR implements no additional Arabic/English translation, stemming, natural-language parsing, neighborhood-name resolution, or guarantee of matching a specific field. A term such as a district name succeeds only to the extent Kite's query supports it. Use neighborhoodId for an explicit structured neighborhood restriction when its ID is already known.

The price filter and `PropertyDTO.price` use normalized **yearly SAR for rent** and total SAR for sale. `rentFrequency` filters the provider's rental-frequency attribute; it does not turn price_min/price_max into monthly values. `postedPrice` and `postedPricePeriod` preserve the original advertised amount/frequency. Render their labels together; never compare a monthly posted amount directly to yearly search prices or multiply a sale total as if it were rent. Missing or unfamiliar posted frequency must remain unknown/raw, not an invented period.

### Response and cursor semantics

Success is HTTP200 `PropertySearchResponseDTO`, with no outer message/data wrapper beyond the DTO itself:

```json
{
  "data": [],
  "pagination": {
    "limit": 20,
    "nextCursor": null,
    "hasMore": false,
    "resultWindowReached": false
  }
}
```

data preserves the provider page and order, including commercial property/land; it is not post-filtered to residential records. Each card is PropertyDTO. Nullable values are retained; absent images become [] and image=null. `listingUrl` is the original listing URL, while `sourceName`/`sourceUrl` carry available provider attribution. Neither source URL nor listing URL is guaranteed populated.

Pagination fields come from Kite: limit is returned page metadata, not necessarily array length; nextCursor is opaque; hasMore describes provider continuation; resultWindowReached indicates the provider search window limit. Do not offer continuation when resultWindowReached=true, even if hasMore=true. No total, page count, numbered pages, previous cursor, or nationwide total is returned. “No more retrievable results” is different from “no more listings exist.” MADAR rejects incomplete pagination with502, including hasMore=true without a usable cursor when the result window has not been reached.

### Complete example requests

```http
GET /api/v1/properties/search?city=riyadh
GET /api/v1/properties/search?city=riyadh&purpose=rent&type=apartment&minPrice=30000&maxPrice=80000&minBedrooms=2&minBathrooms=2&furnished=false&rentFrequency=yearly&sort=price_asc&limit=20
GET /api/v1/properties/search?city=jeddah&purpose=sale&type=villa&minArea=200&maxArea=600&sort=updated_desc&limit=10
GET /api/v1/properties/search?city=riyadh&purpose=rent&q=%D8%B4%D9%82%D8%A9&sort=newest&limit=20
```

Example card/page shape (synthetic; null cursor means there is no next page in this example):

```json
{
  "data": [
    {
      "externalId": "<external-id>",
      "source": "KITE",
      "sourceName": "<original-source-name>",
      "title": "<listing-title>",
      "listingUrl": "https://example.invalid/listing",
      "city": "riyadh",
      "neighborhood": null,
      "propertyType": "apartment",
      "listingType": "rent",
      "price": 60000,
      "bedrooms": 2,
      "areaSqm": 120.0,
      "latitude": 24.7136,
      "longitude": 46.6753,
      "image": null,
      "updatedAt": null,
      "distanceKm": null,
      "description": "<provider-description>",
      "bathrooms": 2,
      "pricePeriod": "yearly",
      "postedPrice": 5000,
      "postedPricePeriod": "monthly",
      "sourceUrl": null,
      "images": [],
      "neighborhoodId": null
    }
  ],
  "pagination": {
    "limit": 20,
    "nextCursor": null,
    "hasMore": false,
    "resultWindowReached": false
  }
}
```

### Next.js URL state and continuation

The frontend URL is the source of truth. Preserve every active filter, city, purpose, sort and limit when moving to the next page; only replace cursor. Encode via URLSearchParams, not string concatenation or decoding the opaque cursor yourself. A filter, city, sort or page-size change must delete the old cursor. Browser history or a frontend cursor stack can support Back; the backend does not produce a previous cursor.

```ts
function nextResultsUrl(current: URLSearchParams, page: PropertySearchResponseDTO): string | null {
  const p = page.pagination;
  if (!p.hasMore || p.resultWindowReached || !p.nextCursor) return null;
  const params = new URLSearchParams(current);
  params.set("cursor", p.nextCursor); // URLSearchParams handles encoding
  return "/properties?" + params.toString();
}
function changedFiltersUrl(current: URLSearchParams, changes: Record<string, string | null>): string {
  const params = new URLSearchParams(current);
  for (const [key, value] of Object.entries(changes)) {
    if (value === null || value === "") params.delete(key);
    else params.set(key, value);
  }
  params.delete("cursor");
  return "/properties?" + params.toString();
}
// Backend API path uses the same validated search params:
// BACKEND_ORIGIN + "/api/v1/properties/search?" + params.toString()
```

A missing city is a city-selection UI state before calling search; the backend still validates it if called. Reset cursor rather than attempting to reuse one for another filter set. Do not attach analytics/query routing parameters to the API request: the search controller rejects unknown parameters. Keep such frontend-only state out of forwarded params.

### Search failures and provider boundaries

- HTTP400: validation errors, unsupported/blank/duplicate/unknown query values, inverted ranges, sale with rentFrequency, provider400 plan/filter/cursor rejection, provider404 city/reference rejection.
- HTTP429: Kite rate limit preserved by the new search path. No quota numbers or Retry-After passthrough are established by code.
- HTTP502: provider connectivity/server/other failures, missing data/pagination, invalid page metadata or null listing entry.
- Error body normally follows ApiResponse; missing query binding may follow framework errors as documented earlier.
- This client reuses the backend Bearer credential. The frontend neither sends nor receives the Kite key. application.properties sets shared HTTP-client connect-timeout=5s and read-timeout=20s for the injected Boot RestClient.Builder. No additional Kite-specific timeout, automatic retry/backoff, cache, result snapshot or rate-limit budget is implemented. Deployment overrides remain possible.
- Legacy property endpoints map provider errors, including rate-limit errors, to ApiException/400 instead of preserving429. Do not assume new-search behavior applies to every property route.
- The existing `GET /properties/results-count/{city}/{listingType}` is not a count for these filters. There is no new filtered-count or public city/neighborhood catalog endpoint.


## Detailed endpoint contracts

Each operation below resolves its controller-level and method-level mappings. Request/response type names refer to the complete shared TypeScript reference above. Every request body example includes writable fields only; PUT operations are full updates, not JSON Patch. All path parameters are required, with no defaults; integer IDs have no universal @Positive annotation and missing/invalid records normally become400. No query parameters other than those explicitly listed form a supported filter contract.

### Properties: public and personalized discovery

#### GET /api/v1/properties/search

**Purpose:** Public discovery with native Kite filters and cursors.

**Controller:** `PropertyController.searchPublic`  
**Module / operation:** Properties: public and personalized discovery; CUSTOM.  
**Access context:** A — Public discovery / anonymous entry; no user setup required.  
**Dependency:** Kite.

**Path parameters:**

None.

**Query parameters / special headers:**

All query fields are defined in [Public property search contract](#public-property-search-contract), including mandatory city, purpose=rent, sort=newest and limit=20. No request body.

**Request body:** None.

**Success response:** `PropertySearchResponseDTO` (direct body). 

```json
{
  "data": [],
  "pagination": {
    "limit": 20,
    "nextCursor": null,
    "hasMore": false,
    "resultWindowReached": false
  }
}
```

**Success status:** 200.

**Error responses:** 400 validation/provider rejection; 429 provider limit; 502 provider/invalid payload. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** No user or saved data. Requires city; omitted purpose is rent. Uses the complete provider page and public mapping, including commercial types and land. See the dedicated public-search contract.

**Frontend integration notes:** Call for homepage/search results after city selection. Keep filters in the URL, reset cursor on any filter change, and distinguish empty results from 400/429/502.

#### GET /api/v1/properties/search/{city}/{listingType}/{propertyType}/{maxPrice}

**Purpose:** Legacy residential search.

**Controller:** `PropertyController.search`  
**Module / operation:** Properties: public and personalized discovery; CUSTOM.  
**Access context:** A — Public discovery / anonymous entry; no user setup required.  
**Dependency:** Kite.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| city | String | Yes | Required nonempty city; legacy property code lowercases it and leaves actual support to Kite. Public-search city syntax is documented separately. |
| listingType | String | Yes | Required rent or sale, case-insensitive in legacy property operations. |
| propertyType | String | Yes | Legacy: apartment, villa, floor, duplex, building, or all, case-insensitive; price-stats excludes all. |
| maxPrice | Integer | Yes | Integer SAR. Legacy price-range requires >0; legacy search has no independent range check. |

**Query parameters / special headers:**

None declared.

**Request body:** None.

**Success response:** `PropertyDTO[]` (direct body). Array elements use the shared DTO fields; the sample illustrates one allowed result state.

```json
[]
```

**Success status:** 200.

**Error responses:** 400 domain or Kite failure. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** city nonempty; listingType rent/sale case-insensitive; propertyType one of five residential types or all (case-insensitive). maxPrice has no explicit local range check here. Fixed upstream limit 20; filters nonresidential records out of that page; no cursor or total.

**Frontend integration notes:** Prefer GET /properties/search for new UI. An empty array is not proof of an exhaustive search.

#### GET /api/v1/properties/get/{source}/{externalId}

**Purpose:** Public listing details.

**Controller:** `PropertyController.getPropertyById`  
**Module / operation:** Properties: public and personalized discovery; CRUD.  
**Access context:** A — Public discovery / anonymous entry; no user setup required.  
**Dependency:** Kite.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| source | String | Yes | Only KITE, case-insensitive, supported by property detail/similar lookup. |
| externalId | String | Yes | Provider listing identifier as String; URL-encode the segment. |

**Query parameters / special headers:**

None declared.

**Request body:** None.

**Success response:** `PropertyDTO` (direct body). 

```json
{
  "externalId": "<external-id>",
  "source": "KITE",
  "sourceName": null,
  "title": "<provider-title>",
  "listingUrl": null,
  "city": "riyadh",
  "neighborhood": null,
  "propertyType": "apartment",
  "listingType": "rent",
  "price": 60000,
  "bedrooms": 2,
  "areaSqm": 120,
  "latitude": 24.7136,
  "longitude": 46.6753,
  "image": null,
  "updatedAt": null,
  "distanceKm": null,
  "description": null,
  "bathrooms": null,
  "pricePeriod": "yearly",
  "postedPrice": null,
  "postedPricePeriod": null,
  "sourceUrl": null,
  "images": [],
  "neighborhoodId": null
}
```

**Success status:** 200.

**Error responses:** 400 unsupported source/not found/provider failure. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** source must equal KITE case-insensitively; externalId is a String, forwarded to provider. Missing provider data raises Property not found. Public converter adds description, bathrooms, posted price, image list and source URL.

**Frontend integration notes:** Open using a search card's source/externalId. Listing may have disappeared. Do not require user setup.

#### GET /api/v1/properties/by-preferences/{userId}

**Purpose:** Listings matching saved housing preferences.

**Controller:** `PropertyController.getByPreferences`  
**Module / operation:** Properties: public and personalized discovery; CUSTOM.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Kite.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |

**Query parameters / special headers:**

None declared.

**Request body:** None.

**Success response:** `PropertyDTO[]` (direct body). Array elements use the shared DTO fields; the sample illustrates one allowed result state.

```json
[]
```

**Success status:** 200.

**Error responses:** 400 missing user/preferences/district or Kite failure. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Requires existing user and housing preference. Lowercases city/purpose/type, truncates maxBudget with intValue; optional district is resolved by Arabic exact or English case-insensitive neighborhood name. Fixed first page, residential only. No commute/essential ranking.

**Frontend integration notes:** Fetch housing preferences first; show setup UI on missing preference, not fabricated recommendations.

#### GET /api/v1/properties/near-location/{city}/{listingType}/{propertyType}/{latitude}/{longitude}/{radiusKm}

**Purpose:** Legacy property discovery around coordinates.

**Controller:** `PropertyController.getNearLocation`  
**Module / operation:** Properties: public and personalized discovery; CUSTOM.  
**Access context:** A — Public discovery / anonymous entry; no user setup required.  
**Dependency:** Kite.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| city | String | Yes | Required nonempty city; legacy property code lowercases it and leaves actual support to Kite. Public-search city syntax is documented separately. |
| listingType | String | Yes | Required rent or sale, case-insensitive in legacy property operations. |
| propertyType | String | Yes | Legacy: apartment, villa, floor, duplex, building, or all, case-insensitive; price-stats excludes all. |
| latitude | Double | Yes | Double coordinate; legacy near-location restricts [16,33]. |
| longitude | Double | Yes | Double coordinate; legacy near-location restricts [34,56]. |
| radiusKm | Double | Yes | Double kilometers, >0 and <=50 for legacy near-location. |

**Query parameters / special headers:**

None declared.

**Request body:** None.

**Success response:** `PropertyDTO[]` (direct body). Array elements use the shared DTO fields; the sample illustrates one allowed result state.

```json
[]
```

**Success status:** 200.

**Error responses:** 400 invalid bounds/filter/provider failure. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Required numeric latitude/longitude/radiusKm path values. Radius (0,50] km; latitude [16,33], longitude [34,56]. Searches a Kite bbox, then filters that one returned page with Haversine and sorts rounded distanceKm. Residential types/all only. Does not explicitly reject nonfinite path numbers locally.

**Frontend integration notes:** Use as bounded map candidate discovery, not exhaustive nationwide radius search; displayed distance is straight-line.

#### GET /api/v1/properties/within-budget/{userId}

**Purpose:** Listings within a user's saved budget.

**Controller:** `PropertyController.getWithinBudget`  
**Module / operation:** Properties: public and personalized discovery; CUSTOM.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Kite.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |

**Query parameters / special headers:**

None declared.

**Request body:** None.

**Success response:** `PropertyDTO[]` (direct body). Array elements use the shared DTO fields; the sample illustrates one allowed result state.

```json
[]
```

**Success status:** 200.

**Error responses:** 400 missing user/preferences/provider failure. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Requires user/housing preference; uses preference city, purpose, type, and integer budget. Does not apply the saved district here. Fixed first residential page.

**Frontend integration notes:** Budget suggestions after housing setup; not a ranked commute report.

#### GET /api/v1/properties/under-budget-margin/{userId}/{margin}

**Purpose:** Listings below saved budget by a SAR margin.

**Controller:** `PropertyController.getUnderBudgetMargin`  
**Module / operation:** Properties: public and personalized discovery; CUSTOM.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Kite.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |
| margin | Integer | Yes | Integer absolute SAR amount >0 and strictly below integer saved budget. |

**Query parameters / special headers:**

None declared.

**Request body:** None.

**Success response:** `PropertyDTO[]` (direct body). Array elements use the shared DTO fields; the sample illustrates one allowed result state.

```json
[]
```

**Success status:** 200.

**Error responses:** 400 invalid margin/missing user/preferences/provider failure. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Requires user/housing preference. margin is Integer SAR, strictly >0 and <integer budget. Maximum price is budget minus margin; no percentage conversion; saved district is not applied.

**Frontend integration notes:** Ask for an absolute SAR savings margin. Treat missing preference separately from empty results.

#### GET /api/v1/properties/by-districts/{city}/{listingType}/{propertyType}/{districts}

**Purpose:** Legacy search in several named districts.

**Controller:** `PropertyController.getByDistricts`  
**Module / operation:** Properties: public and personalized discovery; CUSTOM.  
**Access context:** A — Public discovery / anonymous entry; no user setup required.  
**Dependency:** Kite.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| city | String | Yes | Required nonempty city; legacy property code lowercases it and leaves actual support to Kite. Public-search city syntax is documented separately. |
| listingType | String | Yes | Required rent or sale, case-insensitive in legacy property operations. |
| propertyType | String | Yes | Legacy: apartment, villa, floor, duplex, building, or all, case-insensitive; price-stats excludes all. |
| districts | String | Yes | Comma-separated names, trimmed and resolved via Kite neighborhoods; URL-encode. |

**Query parameters / special headers:**

None declared.

**Request body:** None.

**Success response:** `PropertyDTO[]` (direct body). Array elements use the shared DTO fields; the sample illustrates one allowed result state.

```json
[]
```

**Success status:** 200.

**Error responses:** 400 unknown district/invalid filter/provider failure. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** districts is a required comma-separated path String. Resolves each trimmed name using Kite neighborhoods (Arabic exact/English case-insensitive); any unknown name fails the request. One neighborhood lookup plus one listing call. Residential types/all; fixed first page.

**Frontend integration notes:** URL-encode the path segment. This is not a neighborhood catalog endpoint or complete paginated search.

#### GET /api/v1/properties/price-range/{city}/{listingType}/{propertyType}/{minPrice}/{maxPrice}

**Purpose:** Legacy property price range search.

**Controller:** `PropertyController.getByPriceRange`  
**Module / operation:** Properties: public and personalized discovery; CUSTOM.  
**Access context:** A — Public discovery / anonymous entry; no user setup required.  
**Dependency:** Kite.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| city | String | Yes | Required nonempty city; legacy property code lowercases it and leaves actual support to Kite. Public-search city syntax is documented separately. |
| listingType | String | Yes | Required rent or sale, case-insensitive in legacy property operations. |
| propertyType | String | Yes | Legacy: apartment, villa, floor, duplex, building, or all, case-insensitive; price-stats excludes all. |
| minPrice | Integer | Yes | Integer SAR >=0; must not exceed maxPrice. |
| maxPrice | Integer | Yes | Integer SAR. Legacy price-range requires >0; legacy search has no independent range check. |

**Query parameters / special headers:**

None declared.

**Request body:** None.

**Success response:** `PropertyDTO[]` (direct body). Array elements use the shared DTO fields; the sample illustrates one allowed result state.

```json
[]
```

**Success status:** 200.

**Error responses:** 400 invalid range/filter/provider failure. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** minPrice Integer >=0, maxPrice >0, minPrice<=maxPrice. city/purpose required; residential type/all. Fixed first page.

**Frontend integration notes:** Use the query-based search for new filters and pagination.

#### GET /api/v1/properties/sort/{city}/{listingType}/{sortBy}

**Purpose:** Legacy sorted residential discovery.

**Controller:** `PropertyController.sortProperties`  
**Module / operation:** Properties: public and personalized discovery; CUSTOM.  
**Access context:** A — Public discovery / anonymous entry; no user setup required.  
**Dependency:** Kite.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| city | String | Yes | Required nonempty city; legacy property code lowercases it and leaves actual support to Kite. Public-search city syntax is documented separately. |
| listingType | String | Yes | Required rent or sale, case-insensitive in legacy property operations. |
| sortBy | String | Yes | Legacy: price, price-desc, newest, price-drop; case-insensitive. |

**Query parameters / special headers:**

None declared.

**Request body:** None.

**Success response:** `PropertyDTO[]` (direct body). Array elements use the shared DTO fields; the sample illustrates one allowed result state.

```json
[]
```

**Success status:** 200.

**Error responses:** 400 unsupported sort/filter/provider failure. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** sortBy accepts price, price-desc, newest, price-drop case-insensitively; maps to price_asc, price_desc, newest, price_drop. Fixed 20, then residential-only page filter; city and rent/sale required.

**Frontend integration notes:** No cursor metadata; do not treat a locally filtered page as a total.

#### GET /api/v1/properties/price-stats/{city}/{listingType}/{propertyType}

**Purpose:** Asking-price extrema and count.

**Controller:** `PropertyController.getPriceStats`  
**Module / operation:** Properties: public and personalized discovery; CUSTOM.  
**Access context:** A — Public discovery / anonymous entry; no user setup required.  
**Dependency:** Kite.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| city | String | Yes | Required nonempty city; legacy property code lowercases it and leaves actual support to Kite. Public-search city syntax is documented separately. |
| listingType | String | Yes | Required rent or sale, case-insensitive in legacy property operations. |
| propertyType | String | Yes | Legacy: apartment, villa, floor, duplex, building, or all, case-insensitive; price-stats excludes all. |

**Query parameters / special headers:**

None declared.

**Request body:** None.

**Success response:** `PriceStatsDTO` (direct body). 

```json
{
  "city": "riyadh",
  "listingType": "rent",
  "propertyType": "apartment",
  "totalListings": 0,
  "minPrice": null,
  "maxPrice": null
}
```

**Success status:** 200.

**Error responses:** 400 invalid type/filter/provider failure. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Requires a single residential type, not all. Calls count and two listing searches (ascending/descending price, limit 1). Missing count data defaults to 0; min/max may be null. This is asking-price statistics, not transaction valuation.

**Frontend integration notes:** Three provider requests; show nullable extrema and do not describe as appraisal or median.

#### GET /api/v1/properties/results-count/{city}/{listingType}

**Purpose:** Legacy unfiltered-by-type listing count.

**Controller:** `PropertyController.getResultsCount`  
**Module / operation:** Properties: public and personalized discovery; CUSTOM.  
**Access context:** A — Public discovery / anonymous entry; no user setup required.  
**Dependency:** Kite.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| city | String | Yes | Required nonempty city; legacy property code lowercases it and leaves actual support to Kite. Public-search city syntax is documented separately. |
| listingType | String | Yes | Required rent or sale, case-insensitive in legacy property operations. |

**Query parameters / special headers:**

None declared.

**Request body:** None.

**Success response:** `number` (direct body). 

```json
0
```

**Success status:** 200.

**Error responses:** 400 invalid purpose/city/provider failure. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Requires city and rent/sale; calls Kite count without property type/budget/q filters. Missing count data returns 0.

**Frontend integration notes:** Not the total for the new filtered search. A 0 can also reflect absent count payload.

#### GET /api/v1/properties/similar/{source}/{externalId}

**Purpose:** Price-band similarity candidates.

**Controller:** `PropertyController.getSimilar`  
**Module / operation:** Properties: public and personalized discovery; CUSTOM.  
**Access context:** A — Public discovery / anonymous entry; no user setup required.  
**Dependency:** Kite.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| source | String | Yes | Only KITE, case-insensitive, supported by property detail/similar lookup. |
| externalId | String | Yes | Provider listing identifier as String; URL-encode the segment. |

**Query parameters / special headers:**

None declared.

**Request body:** None.

**Success response:** `PropertyDTO[]` (direct body). Array elements use the shared DTO fields; the sample illustrates one allowed result state.

```json
[]
```

**Success status:** 200.

**Error responses:** 400 insufficient base data/unsupported type/provider failure. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Loads KITE details, requires price and city; queries same city/purpose/type with int(price*0.8)..int(price*1.2), removes the base externalId. Uses legacy residential validation and first-page results; no score or ranking model.

**Frontend integration notes:** Related-listings UI only; not a personalized or AI comparison. Some nonresidential details cannot use this legacy operation.

### Users and administrative user operations

#### POST /api/v1/user/register

**Purpose:** Register a user record.

**Controller:** `UserController.register`  
**Module / operation:** Users and administrative user operations; CRUD.  
**Access context:** A — Public discovery / anonymous entry; no user setup required.  
**Dependency:** Database.

**Path parameters:**

None.

**Query parameters / special headers:**

None declared.

**Request body:** `UserWrite`; validation in the shared DTO section.

```json
{
  "fullName": "<display-name>",
  "email": "user@example.invalid",
  "password": "<user-entered compliant password>"
}
```

**Success response:** `ApiResponse` (direct body). 

```json
{
  "message": "User registered successfully"
}
```

**Success status:** 200.

**Error responses:** 400 validation/duplicate email/persistence. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Checks duplicate email, resets body id, assigns USER internally, saves without password encoding. Returns only a message, not the new ID, user, token or session.

**Frontend integration notes:** Anonymous account creation, not authentication. No login/me/email lookup exists to retrieve the newly registered user's ID; do not invent a working sign-in flow.

#### GET /api/v1/user/get/{userId}

**Purpose:** Read a user profile.

**Controller:** `UserController.getMyAccount`  
**Module / operation:** Users and administrative user operations; CRUD.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Database.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |

**Query parameters / special headers:**

None declared.

**Request body:** None.

**Success response:** `UserResponse` (direct body). 

```json
{
  "id": 1,
  "fullName": "<display-name>",
  "email": "user@example.invalid",
  "createdAt": "2026-10-21T10:00:00"
}
```

**Success status:** 200.

**Error responses:** 400 User not found. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Requires existing user ID. Password, role and relationship collections are excluded from JSON.

**Frontend integration notes:** Needs a user ID supplied by an external/session design that this backend does not implement.

#### PUT /api/v1/user/update/{userId}

**Purpose:** Replace user profile fields.

**Controller:** `UserController.updateMyAccount`  
**Module / operation:** Users and administrative user operations; CRUD.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Database.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |

**Query parameters / special headers:**

None declared.

**Request body:** `UserWrite`; validation in the shared DTO section.

```json
{
  "fullName": "<display-name>",
  "email": "user@example.invalid",
  "password": "<user-entered compliant password>"
}
```

**Success response:** `ApiResponse` (direct body). 

```json
{
  "message": "Account updated successfully"
}
```

**Success status:** 200.

**Error responses:** 400 validation/user not found/email conflict. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Requires existing user, checks email uniqueness against other users; copies fullName, email and password. Full validated User body makes password required even for a name/email edit; role remains unchanged.

**Frontend integration notes:** Use a full replacement form; there is no dedicated change-password route.

#### DELETE /api/v1/user/delete/{userId}

**Purpose:** Delete a user and cascaded data.

**Controller:** `UserController.deleteMyAccount`  
**Module / operation:** Users and administrative user operations; CRUD.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Database.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |

**Query parameters / special headers:**

None declared.

**Request body:** None.

**Success response:** `ApiResponse` (direct body). 

```json
{
  "message": "Account deleted successfully"
}
```

**Success status:** 200.

**Error responses:** 400 user not found/persistence. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Requires existing user. JPA cascades housing/place/essential/saved/current-home/payment relationships; propertyComparisons has no delete cascade and may cause a persistence failure.

**Frontend integration notes:** Destructive confirmation UI. Do not claim deletion always succeeds when comparisons exist.

#### GET /api/v1/user/admin/get-all/{adminId}

**Purpose:** Administrative user listing.

**Controller:** `UserController.getAllUsers`  
**Module / operation:** Users and administrative user operations; CRUD.  
**Access context:** D — Global/internal or administrative operation; actual guard is described below.  
**Dependency:** Database.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| adminId | Integer | Yes | Existing user whose stored role must be ADMIN; supplied ID does not establish caller identity. |

**Query parameters / special headers:**

None declared.

**Request body:** None.

**Success response:** `UserResponse[]` (direct body). Array elements use the shared DTO fields; the sample illustrates one allowed result state.

```json
[]
```

**Success status:** 200.

**Error responses:** 400 admin missing/not ADMIN. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Looks up adminId and checks that stored role equals ADMIN; no authenticated caller binding. No pagination.

**Frontend integration notes:** Do not expose as a way for normal frontend registration to discover IDs. A URL role check is not secure authorization.

#### PUT /api/v1/user/admin/update/{adminId}/{userId}

**Purpose:** Administrative user update.

**Controller:** `UserController.adminUpdateUser`  
**Module / operation:** Users and administrative user operations; CRUD.  
**Access context:** D — Global/internal or administrative operation; actual guard is described below.  
**Dependency:** Database.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| adminId | Integer | Yes | Existing user whose stored role must be ADMIN; supplied ID does not establish caller identity. |
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |

**Query parameters / special headers:**

None declared.

**Request body:** `UserWrite`; validation in the shared DTO section.

```json
{
  "fullName": "<display-name>",
  "email": "user@example.invalid",
  "password": "<user-entered compliant password>"
}
```

**Success response:** `ApiResponse` (direct body). 

```json
{
  "message": "User updated by admin successfully"
}
```

**Success status:** 200.

**Error responses:** 400 admin/user missing/role/email/validation. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Checks stored ADMIN role for supplied adminId, user existence and email uniqueness; copies fullName/email/password only. Same password validation as normal update.

**Frontend integration notes:** Administrative UI only; endpoint remains impersonable without real authentication.

#### DELETE /api/v1/user/admin/delete/{adminId}/{userId}

**Purpose:** Administrative user deletion.

**Controller:** `UserController.adminDeleteUser`  
**Module / operation:** Users and administrative user operations; CRUD.  
**Access context:** D — Global/internal or administrative operation; actual guard is described below.  
**Dependency:** Database.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| adminId | Integer | Yes | Existing user whose stored role must be ADMIN; supplied ID does not establish caller identity. |
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |

**Query parameters / special headers:**

None declared.

**Request body:** None.

**Success response:** `ApiResponse` (direct body). 

```json
{
  "message": "User deleted by admin successfully"
}
```

**Success status:** 200.

**Error responses:** 400 admin/user missing/role/self-delete/persistence. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Checks stored ADMIN role, rejects adminId==userId, then deletes target. Same cascade/persistence limitations as normal deletion.

**Frontend integration notes:** Administrative UI with destructive confirmation; not protected by a trusted caller identity.

### Housing preferences

#### GET /api/v1/housing-preference/get

**Purpose:** Global housing-preference listing.

**Controller:** `HousingPreferenceController.getAllHousingPreferences`  
**Module / operation:** Housing preferences; CRUD.  
**Access context:** D — Global/internal or administrative operation; actual guard is described below.  
**Dependency:** Database.

**Path parameters:**

None.

**Query parameters / special headers:**

None declared.

**Request body:** None.

**Success response:** `HousingPreferenceResponse[]` (direct body). Array elements use the shared DTO fields; the sample illustrates one allowed result state.

```json
[]
```

**Success status:** 200.

**Error responses:** 400 persistence/runtime failures. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Returns all rows without an admin or user check. HousingPreference.user is not JsonIgnore, so each response includes a nested user profile.

**Frontend integration notes:** Internal/global operation classification, not an enforced access restriction. Avoid using it in public discovery.

#### GET /api/v1/housing-preference/get-by-user/{userId}

**Purpose:** Read a user's housing preference.

**Controller:** `HousingPreferenceController.getHousingPreferenceByUserId`  
**Module / operation:** Housing preferences; CRUD.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Database.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |

**Query parameters / special headers:**

None declared.

**Request body:** None.

**Success response:** `HousingPreferenceResponse` (direct body). 

```json
{
  "id": 1,
  "region": "<region>",
  "city": "riyadh",
  "district": null,
  "maxBudget": 80000,
  "propertyType": "apartment",
  "listingType": "rent",
  "user": {
    "id": 1,
    "fullName": "<display-name>",
    "email": "user@example.invalid",
    "createdAt": "2026-10-21T10:00:00"
  }
}
```

**Success status:** 200.

**Error responses:** 400 user/preference not found. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Checks existing user, then one preference by user ID. Missing preference is a 400, not null/404.

**Frontend integration notes:** Show housing setup when the user exists but no preference is stored.

#### POST /api/v1/housing-preference/add/{userId}

**Purpose:** Create housing preference.

**Controller:** `HousingPreferenceController.addHousingPreference`  
**Module / operation:** Housing preferences; CRUD.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Database.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |

**Query parameters / special headers:**

None declared.

**Request body:** `HousingPreferenceWrite`; validation in the shared DTO section.

```json
{
  "region": "<region>",
  "city": "riyadh",
  "district": null,
  "maxBudget": 80000,
  "propertyType": "apartment",
  "listingType": "rent"
}
```

**Success response:** `ApiResponse` (direct body). 

```json
{
  "message": "Housing preference added successfully"
}
```

**Success status:** 201.

**Error responses:** 400 validation/user missing/already configured/persistence. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Checks user and rejects a second preference; assigns user from path. Does not explicitly clear a submitted body id; frontend must omit it. Region is stored but not used by property filtering.

**Frontend integration notes:** Create once, then refetch by user to obtain preferenceId. No home/commute setup required.

#### PUT /api/v1/housing-preference/update/{userId}/{preferenceId}

**Purpose:** Replace housing preference.

**Controller:** `HousingPreferenceController.updateHousingPreference`  
**Module / operation:** Housing preferences; CRUD.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Database.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |
| preferenceId | Integer | Yes | Local HousingPreference ID owned by userId. |

**Query parameters / special headers:**

None declared.

**Request body:** `HousingPreferenceWrite`; validation in the shared DTO section.

```json
{
  "region": "<region>",
  "city": "riyadh",
  "district": null,
  "maxBudget": 80000,
  "propertyType": "apartment",
  "listingType": "rent"
}
```

**Success response:** `ApiResponse` (direct body). 

```json
{
  "message": "Housing preference updated successfully"
}
```

**Success status:** 200.

**Error responses:** 400 user/preference missing/ownership/validation. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Checks user, preference and ownership; replaces region/city/district/maxBudget/propertyType/listingType. Omitting district clears it.

**Frontend integration notes:** Use full form with preferenceId from GET. Does not update current home or interests.

#### DELETE /api/v1/housing-preference/delete/{userId}/{preferenceId}

**Purpose:** Delete housing preference.

**Controller:** `HousingPreferenceController.deleteHousingPreference`  
**Module / operation:** Housing preferences; CRUD.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Database.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |
| preferenceId | Integer | Yes | Local HousingPreference ID owned by userId. |

**Query parameters / special headers:**

None declared.

**Request body:** None.

**Success response:** `ApiResponse` (direct body). 

```json
{
  "message": "Housing preference deleted successfully"
}
```

**Success status:** 200.

**Error responses:** 400 user/preference missing/ownership. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Checks user, record and ownership. Does not delete public Kite listings.

**Frontend integration notes:** Invalidate preference-based recommendation and summary queries.

#### GET /api/v1/housing-preference/match-summary/{userId}

**Purpose:** Saved-preference market summary.

**Controller:** `HousingPreferenceController.getMatchSummary`  
**Module / operation:** Housing preferences; CUSTOM.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Kite.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |

**Query parameters / special headers:**

None declared.

**Request body:** None.

**Success response:** `MatchSummaryDTO` (direct body). 

```json
{
  "budget": 80000,
  "totalListings": 0,
  "inMyDistrict": null,
  "cheapestPrice": null
}
```

**Success status:** 200.

**Error responses:** 400 missing setup/district/provider/runtime error. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Requires user/housing preference. Counts matching inventory within budget, optionally counts district, and fetches cheapest matching listing. budget uses intValue; inMyDistrict null if no district; missing payload counts can become 0. A returned listing with null price can trigger a runtime error.

**Frontend integration notes:** This is counts and a cheapest asking price, not a match percentage, property list or commute/essential score.

### Commute destinations and public nearby services

#### GET /api/v1/place-preference/get/{userId}

**Purpose:** List saved commute destinations.

**Controller:** `PlacePreferenceController.getMyPlaces`  
**Module / operation:** Commute destinations and public nearby services; CRUD.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Database.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |

**Query parameters / special headers:**

None declared.

**Request body:** None.

**Success response:** `PlacePreferenceResponse[]` (direct body). Array elements use the shared DTO fields; the sample illustrates one allowed result state.

```json
[
  {
    "id": 1,
    "name": "<destination-name>",
    "type": "work",
    "latitude": 24.7136,
    "longitude": 46.6753,
    "importance": 5,
    "visitPerWeek": 5
  }
]
```

**Success status:** 200.

**Error responses:** 400 user missing/no places. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Requires existing user; if no destinations, throws No places found for this user (400), not an empty array.

**Frontend integration notes:** Render an add-destination state for the documented absence message; do not conflate provider errors with empty state.

#### POST /api/v1/place-preference/add/{userId}

**Purpose:** Add a fixed commute destination.

**Controller:** `PlacePreferenceController.addPlace`  
**Module / operation:** Commute destinations and public nearby services; CRUD.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Database.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |

**Query parameters / special headers:**

None declared.

**Request body:** `PlacePreferenceWrite`; validation in the shared DTO section.

```json
{
  "name": "<destination-name>",
  "type": "work",
  "latitude": 24.7136,
  "longitude": 46.6753,
  "importance": 5,
  "visitPerWeek": 5
}
```

**Success response:** `ApiResponse` (direct body). 

```json
{
  "message": "Place added successfully"
}
```

**Success status:** 200.

**Error responses:** 400 user missing/validation/persistence. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Checks user, resets id, sets user and saves actual name/type/coordinates/importance/visitPerWeek. type is free text here, not the nearby category whitelist.

**Frontend integration notes:** This saves a specific location; do not use it for general essential search interests.

#### PUT /api/v1/place-preference/update/{userId}/{placeId}

**Purpose:** Replace commute destination.

**Controller:** `PlacePreferenceController.updatePlace`  
**Module / operation:** Commute destinations and public nearby services; CRUD.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Database.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |
| placeId | Integer | Yes | Local PlacePreference commute-destination ID, not Google place ID. |

**Query parameters / special headers:**

None declared.

**Request body:** `PlacePreferenceWrite`; validation in the shared DTO section.

```json
{
  "name": "<destination-name>",
  "type": "work",
  "latitude": 24.7136,
  "longitude": 46.6753,
  "importance": 5,
  "visitPerWeek": 5
}
```

**Success response:** `ApiResponse` (direct body). 

```json
{
  "message": "Place updated successfully"
}
```

**Success status:** 200.

**Error responses:** 400 place missing/ownership/validation. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Finds destination and checks stored user ID matches path; copies all destination fields. Does not separately load user.

**Frontend integration notes:** Refetch destinations/report after editing. Owner checks do not authenticate a caller.

#### DELETE /api/v1/place-preference/delete/{userId}/{placeId}

**Purpose:** Delete commute destination.

**Controller:** `PlacePreferenceController.deletePlace`  
**Module / operation:** Commute destinations and public nearby services; CRUD.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Database.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |
| placeId | Integer | Yes | Local PlacePreference commute-destination ID, not Google place ID. |

**Query parameters / special headers:**

None declared.

**Request body:** None.

**Success response:** `ApiResponse` (direct body). 

```json
{
  "message": "Place deleted successfully"
}
```

**Success status:** 200.

**Error responses:** 400 missing place/ownership. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Finds destination and checks owner ID; no independent user lookup.

**Frontend integration notes:** Invalidate destination and commute-report data.

#### PATCH /api/v1/place-preference/importance/{userId}/{placeId}/{importance}

**Purpose:** Update destination importance only.

**Controller:** `PlacePreferenceController.updateImportance`  
**Module / operation:** Commute destinations and public nearby services; CRUD.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Database.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |
| placeId | Integer | Yes | Local PlacePreference commute-destination ID, not Google place ID. |
| importance | Integer | Yes | Integer in [1,5]. |

**Query parameters / special headers:**

None declared.

**Request body:** None.

**Success response:** `ApiResponse` (direct body). 

```json
{
  "message": "Place importance updated successfully"
}
```

**Success status:** 200.

**Error responses:** 400 missing place/ownership/importance range. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** importance is an Integer path variable, must be 1..5. Finds destination and checks owner. Other destination fields unchanged.

**Frontend integration notes:** Use PATCH without JSON body for priority slider.

#### GET /api/v1/place-preference/calculate-commutes/{userId}

**Purpose:** Paid personalized driving commute analysis.

**Controller:** `PlacePreferenceController.calculateCommutes`  
**Module / operation:** Commute destinations and public nearby services; CUSTOM.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Google Routes + Database.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |

**Query parameters / special headers:**

| Name | Type | Required | Default | Validation |
|---|---|---|---|---|
| latitude | Double | Yes | None | Finite [-90,90], selected property origin |
| longitude | Double | Yes | None | Finite [-180,180] |

**Request body:** None.

**Success response:** `CommuteSummaryResponseDTO` (direct body). 

```json
{
  "commutes": [
    {
      "placePreferenceId": 1,
      "placeName": "<destination-name>",
      "placeType": "work",
      "importance": 5,
      "visitPerWeek": 5,
      "distanceKm": 10,
      "durationMinutes": 30
    }
  ],
  "totalWeeklyMinutes": 300,
  "totalWeeklyHours": 5,
  "commuteScore": 75
}
```

**Success status:** 200.

**Error responses:** 400 invalid coordinates/no destinations/provider/weights; 402 missing active pass. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** First requires active COMMUTE_REPORT access (402 otherwise), then existing user, valid finite target coordinates and saved destinations. One driving/traffic-aware Routes call per destination. Weekly minutes=one-way minutes*visits*2; weighted score clamps 15-min-or-less to100 and 75-min-or-more to0, weights importance*visits; nonpositive total weight errors. Distances/minutes rounded to 1 decimal; hours/score to2.

**Frontend integration notes:** Sequence destinations → access/checkout/verify → analysis for selected property coordinates. Current-home confirmation is not required. Not a search-results ranking endpoint.

#### GET /api/v1/place-preference/nearby-services

**Purpose:** Public category-based nearby places.

**Controller:** `PlacePreferenceController.getNearbyServices`  
**Module / operation:** Commute destinations and public nearby services; CUSTOM.  
**Access context:** A — Public discovery / anonymous entry; no user setup required.  
**Dependency:** Google Places.

**Path parameters:**

None.

**Query parameters / special headers:**

| Name | Type | Required | Default | Validation |
|---|---|---|---|---|
| latitude | Double | Yes | None | Finite [-90,90] |
| longitude | Double | Yes | None | Finite [-180,180] |
| placeType | String | Yes | None | Exact NearbyCategory, nine supported types |
| radiusMeters | Double | No | 2000 | Finite >0 and <=50000 meters |

**Request body:** None.

**Success response:** `GooglePlacesResponseDTO` (direct body). 

```json
{
  "places": []
}
```

**Success status:** 200.

**Error responses:** 400 invalid coordinates/category/radius/provider failure. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** No user ID, preferences or payment required. Valid finite world coordinates, supported provider category, radius (0,50000] meters. Existing client returns up to10 distance-ranked places with no distance field; null provider body becomes empty places.

**Frontend integration notes:** Use for nearby discovery around any selected map point, not for persisting a destination or autocomplete.

### Essential interests

#### GET /api/v1/essential-interest/get/{userId}

**Purpose:** List user-defined essential interests.

**Controller:** `EssentialInterestController.getMyInterests`  
**Module / operation:** Essential interests; CRUD.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Database.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |

**Query parameters / special headers:**

None declared.

**Request body:** None.

**Success response:** `EssentialInterestResponse[]` (direct body). Array elements use the shared DTO fields; the sample illustrates one allowed result state.

```json
[]
```

**Success status:** 200.

**Error responses:** 400 user missing. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Checks user; returns [] when none, sorted priority descending, null priorities last, then id ascending. Does not require current home.

**Frontend integration notes:** Use to edit general service/business interests independently of commute destinations.

#### POST /api/v1/essential-interest/add/{userId}

**Purpose:** Add an essential interest.

**Controller:** `EssentialInterestController.addInterest`  
**Module / operation:** Essential interests; CRUD.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Database.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |

**Query parameters / special headers:**

None declared.

**Request body:** `EssentialInterestWrite`; validation in the shared DTO section.

```json
{
  "name": "Jarir",
  "searchTerm": "Jarir",
  "searchMode": "TEXT",
  "priority": 3
}
```

**Success response:** `ApiResponse` (direct body). 

```json
{
  "message": "Essential interest added successfully"
}
```

**Success status:** 201.

**Error responses:** 400 user missing/validation/persistence. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Checks user, clears id, assigns user. No whitelist applies to searchTerm and no default interests are created. Mode defaults TEXT when omitted.

**Frontend integration notes:** Accept custom businesses/service text and add multiple records. Refetch list for new ID.

#### PUT /api/v1/essential-interest/update/{userId}/{interestId}

**Purpose:** Replace an essential interest.

**Controller:** `EssentialInterestController.updateInterest`  
**Module / operation:** Essential interests; CRUD.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Database.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |
| interestId | Integer | Yes | Local EssentialInterest ID owned by userId. |

**Query parameters / special headers:**

None declared.

**Request body:** `EssentialInterestWrite`; validation in the shared DTO section.

```json
{
  "name": "Jarir",
  "searchTerm": "Jarir",
  "searchMode": "TEXT",
  "priority": 3
}
```

**Success response:** `ApiResponse` (direct body). 

```json
{
  "message": "Essential interest updated successfully"
}
```

**Success status:** 200.

**Error responses:** 400 user/interest missing/validation. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Checks user and ownership query, copies name/searchTerm/searchMode/priority. Omitted mode defaults TEXT; omitted/null priority clears priority. Existing home is unrelated.

**Frontend integration notes:** PUT is full replacement. Preserve mode if the UI intends no mode change.

#### DELETE /api/v1/essential-interest/delete/{userId}/{interestId}

**Purpose:** Delete an essential interest.

**Controller:** `EssentialInterestController.deleteInterest`  
**Module / operation:** Essential interests; CRUD.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Database.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |
| interestId | Integer | Yes | Local EssentialInterest ID owned by userId. |

**Query parameters / special headers:**

None declared.

**Request body:** None.

**Success response:** `ApiResponse` (direct body). 

```json
{
  "message": "Essential interest deleted successfully"
}
```

**Success status:** 200.

**Error responses:** 400 user/interest missing. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Checks user and finds by both interestId and userId before delete.

**Frontend integration notes:** Invalidate saved interests and nearest-essential results; never create defaults to replace it.

### Current home and neighborhood

#### GET /api/v1/current-home/get

**Purpose:** Global current-home listing.

**Controller:** `CurrentHomeController.getAllCurrentHomes`  
**Module / operation:** Current home and neighborhood; CRUD.  
**Access context:** D — Global/internal or administrative operation; actual guard is described below.  
**Dependency:** Database.

**Path parameters:**

None.

**Query parameters / special headers:**

None declared.

**Request body:** None.

**Success response:** `CurrentHomeResponse[]` (direct body). Array elements use the shared DTO fields; the sample illustrates one allowed result state.

```json
[]
```

**Success status:** 200.

**Error responses:** 400 persistence/runtime failures. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Returns all current homes without role/user checks; user relation is excluded.

**Frontend integration notes:** Internal/global classification only; actual implementation exposes all stored home coordinates.

#### GET /api/v1/current-home/get-by-user/{userId}

**Purpose:** Read user's single current home.

**Controller:** `CurrentHomeController.getCurrentHomeByUserId`  
**Module / operation:** Current home and neighborhood; CRUD.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Database.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |

**Query parameters / special headers:**

None declared.

**Request body:** None.

**Success response:** `CurrentHomeResponse` (direct body). 

```json
{
  "id": 1,
  "latitude": 24.7136,
  "longitude": 46.6753,
  "externalPropertyId": null,
  "source": null,
  "movedInAt": null,
  "confirmedByUserAt": "2026-10-21T10:00:00"
}
```

**Success status:** 200.

**Error responses:** 400 user/home missing. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Validates user and home existence; does not require movedInAt.

**Frontend integration notes:** Use to discover homeId and setup/confirmation state.

#### POST /api/v1/current-home/add/{userId}

**Purpose:** Create user's current home.

**Controller:** `CurrentHomeController.addCurrentHome`  
**Module / operation:** Current home and neighborhood; CRUD.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Database.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |

**Query parameters / special headers:**

None declared.

**Request body:** `CurrentHomeWrite`; validation in the shared DTO section.

```json
{
  "latitude": 24.7136,
  "longitude": 46.6753,
  "externalPropertyId": null,
  "source": null,
  "movedInAt": null
}
```

**Success response:** `ApiResponse` (direct body). 

```json
{
  "message": "Current home added successfully"
}
```

**Success status:** 201.

**Error responses:** 400 user missing/home already exists/validation/persistence. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Checks user, rejects an existing home, sets user and saves. confirmedByUserAt is populated by PrePersist; movedInAt is caller-supplied optional. Does not clear supplied body id; omit generated fields.

**Frontend integration notes:** Refetch home after success. No route selects a saved property automatically; frontend must supply stored listing coordinates/reference.

#### PUT /api/v1/current-home/update/{userId}/{homeId}

**Purpose:** Replace current-home data.

**Controller:** `CurrentHomeController.updateCurrentHome`  
**Module / operation:** Current home and neighborhood; CRUD.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Database.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |
| homeId | Integer | Yes | Local CurrentHome record ID owned by userId. |

**Query parameters / special headers:**

None declared.

**Request body:** `CurrentHomeWrite`; validation in the shared DTO section.

```json
{
  "latitude": 24.7136,
  "longitude": 46.6753,
  "externalPropertyId": null,
  "source": null,
  "movedInAt": null
}
```

**Success response:** `ApiResponse` (direct body). 

```json
{
  "message": "Current home updated successfully"
}
```

**Success status:** 200.

**Error responses:** 400 missing user/home/ownership/validation. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Checks user/home and ownership; copies coordinates, externalPropertyId, source and movedInAt. Does not update confirmedByUserAt or essential interests.

**Frontend integration notes:** Use when moving again. Null movedInAt clears confirmation; submitting a date also satisfies the read gate without confirm-move.

#### DELETE /api/v1/current-home/delete/{userId}/{homeId}

**Purpose:** Delete current home.

**Controller:** `CurrentHomeController.deleteCurrentHome`  
**Module / operation:** Current home and neighborhood; CRUD.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Database.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |
| homeId | Integer | Yes | Local CurrentHome record ID owned by userId. |

**Query parameters / special headers:**

None declared.

**Request body:** None.

**Success response:** `ApiResponse` (direct body). 

```json
{
  "message": "Current home deleted successfully"
}
```

**Success status:** 200.

**Error responses:** 400 missing user/home/ownership. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Checks user/home/ownership, deletes only the home. Essential interests remain associated with the user.

**Frontend integration notes:** Return to home setup; retain essential-interest forms.

#### POST /api/v1/current-home/{userId}/confirm-move

**Purpose:** Confirm physical move using stored home date.

**Controller:** `CurrentHomeController.confirmMove`  
**Module / operation:** Current home and neighborhood; CUSTOM.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Database.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |

**Query parameters / special headers:**

None declared.

**Request body:** None.

**Success response:** `ApiResponse` (direct body). 

```json
{
  "message": "Move confirmed successfully"
}
```

**Success status:** 200.

**Error responses:** 400 user/home missing. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Locks user and current-home row; sets movedInAt to server LocalDate.now only when null, preserving an existing date and all other home data. No new home is created.

**Frontend integration notes:** Call after home setup; repeated confirmation is safe. This is a user declaration, not independent verification of residence.

#### GET /api/v1/current-home/{userId}/neighborhood

**Purpose:** Confirmed-home neighborhood overview.

**Controller:** `CurrentHomeController.getNeighborhood`  
**Module / operation:** Current home and neighborhood; CUSTOM.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Google Places.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |

**Query parameters / special headers:**

None declared.

**Request body:** None.

**Success response:** `NeighborhoodResponseDTO` (direct body). 

```json
{
  "homeId": 1,
  "location": {
    "latitude": 24.7136,
    "longitude": 46.6753
  },
  "radiusMeters": 2000,
  "places": [],
  "categories": [
    {
      "category": "cafe",
      "returnedCount": 0,
      "placeIds": []
    },
    {
      "category": "gym",
      "returnedCount": 0,
      "placeIds": []
    },
    {
      "category": "hospital",
      "returnedCount": 0,
      "placeIds": []
    },
    {
      "category": "park",
      "returnedCount": 0,
      "placeIds": []
    },
    {
      "category": "pharmacy",
      "returnedCount": 0,
      "placeIds": []
    },
    {
      "category": "restaurant",
      "returnedCount": 0,
      "placeIds": []
    },
    {
      "category": "school",
      "returnedCount": 0,
      "placeIds": []
    },
    {
      "category": "shopping_mall",
      "returnedCount": 0,
      "placeIds": []
    },
    {
      "category": "supermarket",
      "returnedCount": 0,
      "placeIds": []
    }
  ],
  "completeInventory": false
}
```

**Success status:** 200.

**Error responses:** 400 missing/invalid/unconfirmed home or provider failure. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Requires existing user, home, non-null movedInAt, valid coordinates. Uses 2000m and nine supported categories, up to10 results each; deduplicates place objects by ID and associates category IDs/counts. completeInventory=false. Any category provider exception aborts the whole request.

**Frontend integration notes:** Counts are returned samples, not coverage or total businesses. Up to nine provider calls; show whole-request provider error rather than zero availability.

#### GET /api/v1/current-home/{userId}/nearby-by-category

**Purpose:** Category search around confirmed home.

**Controller:** `CurrentHomeController.getNearbyByCategory`  
**Module / operation:** Current home and neighborhood; CUSTOM.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Google Places.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |

**Query parameters / special headers:**

| Name | Type | Required | Default | Validation |
|---|---|---|---|---|
| category | String | Yes | None | Exact NearbyCategory; arbitrary text unsupported here |
| radius | Double | Yes | None | Finite >0 and <=50000 meters |

**Request body:** None.

**Success response:** `GooglePlacesResponseDTO` (direct body). 

```json
{
  "places": []
}
```

**Success status:** 200.

**Error responses:** 400 home/category/radius/provider failure. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Same confirmed-home gate; category must be one of nine supported exact strings, radius finite (0,50000] meters. No distance field in this DTO.

**Frontend integration notes:** Use provider categories, not arbitrary user essential text.

#### GET /api/v1/current-home/{userId}/nearest-essential

**Purpose:** Nearest candidates for user's own essentials.

**Controller:** `CurrentHomeController.getNearestEssential`  
**Module / operation:** Current home and neighborhood; CUSTOM.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Google Places + Database.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |

**Query parameters / special headers:**

| Name | Type | Required | Default | Validation |
|---|---|---|---|---|
| radius | Double | No | 2000 | Finite >0 and <=50000 meters |

**Request body:** None.

**Success response:** `NearestEssentialResponseDTO[]` (direct body). Array elements use the shared DTO fields; the sample illustrates one allowed result state.

```json
[
  {
    "interest": {
      "id": 1,
      "name": "Jarir",
      "searchTerm": "Jarir",
      "searchMode": "TEXT",
      "priority": 3
    },
    "searchMethod": "TEXT",
    "status": "NO_MATCH",
    "found": false,
    "place": null,
    "straightLineDistanceMeters": null
  }
]
```

**Success status:** 200.

**Error responses:** 400 invalid radius/user/home; provider ApiExceptions become SEARCH_FAILED items. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Validate radius, fetch user interests first; no interests =>[] even without home. Otherwise confirmed home required. Supported CATEGORY uses Nearby; TEXT and unsupported CATEGORY use original trimmed text via Text Search. Find minimum Haversine within radius among valid returned coordinates. Deduplicate identical effective method+term calls within request, including failure/empty results; preserve one result per interest.

**Frontend integration notes:** Handle FOUND, NO_MATCH and SEARCH_FAILED separately, including partial/all failures within HTTP200. Nearest means nearest returned candidate, not exhaustive inventory. Interests survive home changes.

#### GET /api/v1/current-home/{userId}/nearby-search

**Purpose:** Free-text place search around confirmed home.

**Controller:** `CurrentHomeController.searchNearby`  
**Module / operation:** Current home and neighborhood; CUSTOM.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Google Places.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |

**Query parameters / special headers:**

| Name | Type | Required | Default | Validation |
|---|---|---|---|---|
| query | String | Yes | None | Nonblank; trimmed for provider; no explicit service length cap |
| radius | Double | No | 2000 | Finite >0 and <=50000 meters |

**Request body:** None.

**Success response:** `NearbyPlaceResponseDTO[]` (direct body). Array elements use the shared DTO fields; the sample illustrates one allowed result state.

```json
[
  {
    "place": {
      "id": "<google-place-id>",
      "displayName": {
        "text": "<provider-place-name>"
      },
      "formattedAddress": null,
      "location": {
        "latitude": 24.7136,
        "longitude": 46.6753
      },
      "primaryType": null,
      "types": null
    },
    "straightLineDistanceMeters": 0
  }
]
```

**Success status:** 200.

**Error responses:** 400 missing/invalid/unconfirmed home/query/radius/provider failure. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Requires confirmed home and nonblank query. Text Search with home locationBias, then filters valid coordinates by Haversine radius, deduplicates by ID and sorts straightLineDistanceMeters. Up to20 candidates; no provider pagination exposed.

**Frontend integration notes:** Arabic/English passed unchanged except trim; bias is not a radius guarantee. No travel-time estimates.

### Saved properties

#### GET /api/v1/saved-property/get/{userId}

**Purpose:** Read saved property references.

**Controller:** `SavedPropertyController.getMySavedProperty`  
**Module / operation:** Saved properties; CRUD.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Database.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |

**Query parameters / special headers:**

None declared.

**Request body:** None.

**Success response:** `SavedPropertyResponse[]` (direct body). Array elements use the shared DTO fields; the sample illustrates one allowed result state.

```json
[
  {
    "id": 1,
    "externalPropertyId": "<external-id>",
    "source": "KITE",
    "titleSnapshot": null,
    "savedAt": "2026-10-21T10:00:00"
  }
]
```

**Success status:** 200.

**Error responses:** 400 missing user/no saved properties. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Checks user; no saved properties throws No saved properties found for this user (400). Does not fetch current Kite details.

**Frontend integration notes:** Fetch details separately for references; handle disappeared listings and stale optional titleSnapshot.

#### POST /api/v1/saved-property/add/{userId}

**Purpose:** Save a listing reference.

**Controller:** `SavedPropertyController.addSavedProperty`  
**Module / operation:** Saved properties; CRUD.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Database.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |

**Query parameters / special headers:**

None declared.

**Request body:** `SavedPropertyWrite`; validation in the shared DTO section.

```json
{
  "externalPropertyId": "<external-id>",
  "source": "KITE",
  "titleSnapshot": null
}
```

**Success response:** `ApiResponse` (direct body). 

```json
{
  "message": "Property saved successfully"
}
```

**Success status:** 200.

**Error responses:** 400 user missing/duplicate/validation/persistence. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Checks user, uppercases source, rejects duplicate user/source/externalPropertyId, clears id, saves reference. Does not verify listing existence or supported source against Kite.

**Frontend integration notes:** Send source=KITE and card externalId; this does not purchase or select a current home.

#### DELETE /api/v1/saved-property/delete/{userId}/{savedPropertyId}

**Purpose:** Remove a saved reference.

**Controller:** `SavedPropertyController.deleteSavedProperty`  
**Module / operation:** Saved properties; CRUD.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Database.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |
| savedPropertyId | Integer | Yes | Local SavedProperty ID, not external listing ID. |

**Query parameters / special headers:**

None declared.

**Request body:** None.

**Success response:** `ApiResponse` (direct body). 

```json
{
  "message": "Saved property deleted successfully"
}
```

**Success status:** 200.

**Error responses:** 400 saved record missing/ownership. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Finds savedPropertyId and verifies owner matches supplied userId; does not separately retrieve user.

**Frontend integration notes:** Use local savedPropertyId, not Kite externalId. Refetch list; it becomes a 400 absence state when last item removed.

### Property comparisons

#### GET /api/v1/property-comparison/get

**Purpose:** Global comparison-reference listing.

**Controller:** `PropertyComparisonController.getAllComparisons`  
**Module / operation:** Property comparisons; CRUD.  
**Access context:** D — Global/internal or administrative operation; actual guard is described below.  
**Dependency:** Database.

**Path parameters:**

None.

**Query parameters / special headers:**

None declared.

**Request body:** None.

**Success response:** `PropertyComparisonResponse[]` (direct body). Array elements use the shared DTO fields; the sample illustrates one allowed result state.

```json
[]
```

**Success status:** 200.

**Error responses:** 400 persistence/runtime failures. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Returns all comparison records without an admin/user guard; user relation excluded.

**Frontend integration notes:** Internal/global classification, not secure administrative enforcement.

#### GET /api/v1/property-comparison/get-by-user/{userId}

**Purpose:** List comparison references for user.

**Controller:** `PropertyComparisonController.getComparisonsByUserId`  
**Module / operation:** Property comparisons; CRUD.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Database.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |

**Query parameters / special headers:**

None declared.

**Request body:** None.

**Success response:** `PropertyComparisonResponse[]` (direct body). Array elements use the shared DTO fields; the sample illustrates one allowed result state.

```json
[]
```

**Success status:** 200.

**Error responses:** 400 user missing. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Checks user, returns [] if no comparisons; no computed result/score or provider lookup.

**Frontend integration notes:** List saved pairs; fetch each property's public details separately.

#### GET /api/v1/property-comparison/get-by-id/{userId}/{comparisonId}

**Purpose:** Read one user-owned comparison.

**Controller:** `PropertyComparisonController.getComparisonById`  
**Module / operation:** Property comparisons; CRUD.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Database.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |
| comparisonId | Integer | Yes | Local PropertyComparison ID owned by userId. |

**Query parameters / special headers:**

None declared.

**Request body:** None.

**Success response:** `PropertyComparisonResponse` (direct body). 

```json
{
  "id": 1,
  "firstPropertyId": "<first-external-id>",
  "secondPropertyId": "<second-external-id>",
  "firstPropertySource": "KITE",
  "secondPropertySource": "KITE",
  "createdAt": "2026-10-21T10:00:00"
}
```

**Success status:** 200.

**Error responses:** 400 comparison missing for supplied user. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Finds by comparisonId and userId; no separate user lookup. Missing result is Comparison not found for this user.

**Frontend integration notes:** No precomputed comparison analysis is returned.

#### POST /api/v1/property-comparison/add/{userId}

**Purpose:** Save a pair of property references.

**Controller:** `PropertyComparisonController.addComparison`  
**Module / operation:** Property comparisons; CRUD.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Database.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |

**Query parameters / special headers:**

None declared.

**Request body:** `PropertyComparisonWrite`; validation in the shared DTO section.

```json
{
  "firstPropertyId": "<first-external-id>",
  "secondPropertyId": "<second-external-id>",
  "firstPropertySource": "KITE",
  "secondPropertySource": "KITE"
}
```

**Success response:** `ApiResponse` (direct body). 

```json
{
  "message": "Comparison added successfully"
}
```

**Success status:** 201.

**Error responses:** 400 user missing/same property/duplicate pair/validation/persistence. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Checks user. Rejects identical ID+source pairs and duplicates in either pair order for that user. Source/ID comparisons are case-sensitive, no source normalization or external listing validation. Does not clear body id; omit it.

**Frontend integration notes:** Save pair, refetch comparisons for generated ID. Normalize UI source to KITE consistently.

#### PUT /api/v1/property-comparison/update/{userId}/{comparisonId}

**Purpose:** Replace a saved comparison pair.

**Controller:** `PropertyComparisonController.updateComparison`  
**Module / operation:** Property comparisons; CRUD.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Database.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |
| comparisonId | Integer | Yes | Local PropertyComparison ID owned by userId. |

**Query parameters / special headers:**

None declared.

**Request body:** `PropertyComparisonWrite`; validation in the shared DTO section.

```json
{
  "firstPropertyId": "<first-external-id>",
  "secondPropertyId": "<second-external-id>",
  "firstPropertySource": "KITE",
  "secondPropertySource": "KITE"
}
```

**Success response:** `ApiResponse` (direct body). 

```json
{
  "message": "Comparison updated successfully"
}
```

**Success status:** 200.

**Error responses:** 400 comparison missing/same property/duplicate/validation. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Finds by local id and userId; validates same-property and both-order duplicate rules excluding this record; updates four reference fields.

**Frontend integration notes:** No independent user existence check and no provider calls; this is not a paid advanced-analysis API.

#### DELETE /api/v1/property-comparison/delete/{userId}/{comparisonId}

**Purpose:** Delete saved comparison.

**Controller:** `PropertyComparisonController.deleteComparison`  
**Module / operation:** Property comparisons; CRUD.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Database.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |
| comparisonId | Integer | Yes | Local PropertyComparison ID owned by userId. |

**Query parameters / special headers:**

None declared.

**Request body:** None.

**Success response:** `ApiResponse` (direct body). 

```json
{
  "message": "Comparison deleted successfully"
}
```

**Success status:** 200.

**Error responses:** 400 comparison missing for user. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Deletes only the comparison found by id and userId; does not load user separately.

**Frontend integration notes:** Invalidate pair list; no actual property listing is deleted.

### Payments and access

#### POST /api/v1/payments/{userId}/checkout

**Purpose:** Create or resume server-priced checkout.

**Controller:** `PaymentController.checkout`  
**Module / operation:** Payments and access; CUSTOM.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Moyasar + Database.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |

**Query parameters / special headers:**

None. Required header: `Idempotency-Key: <canonical UUID>`. Generate one UUID per logical checkout attempt and retain it across retries of that same attempt; do not send provider credentials. See the payment flow.

**Request body:** `CheckoutRequestDTO`; validation in the shared DTO section.

```json
{
  "serviceType": "COMMUTE_REPORT"
}
```

**Success response:** `CheckoutResponseDTO` (direct body). 

```json
{
  "paymentId": 1,
  "serviceType": "COMMUTE_REPORT",
  "amount": 900,
  "currency": "SAR",
  "intentId": "<intent-id>",
  "clientSecret": "<redacted checkout client secret>",
  "expiresAt": "2026-10-21T10:30:00+03:00",
  "givenId": "<UUID allocated by backend>",
  "metadata": {
    "madar_payment_id": "1",
    "user_id": "1",
    "service_type": "COMMUTE_REPORT"
  }
}
```

**Success status:** 201.

**Response header:** `Cache-Control: no-store` is explicitly set by this controller.

**Error responses:** 400 input/user/setup; 409 used/expired/mismatched intent; 502 provider; 503 missing config or uncertain prior creation. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Requires user, service COMMUTE_REPORT, canonical UUID Idempotency-Key, valid service config/HTTPS callback/webhook secret, saved destinations with valid coords/importance/visits and positive total usable weight. Default 900 halalas SAR/24h, configurable. Rejects already-active access. Snapshots amount/currency/duration and allocates local paymentId, locked description reference, provider givenId and intent. Reusing same key/user/service reuses usable intent; no second intent for that key.

**Frontend integration notes:** Do not send amount/status/card data. Cache-Control:no-store. Frontend must fulfill directly at provider with given_id, metadata and client_secret; see payment flow. A message-only registration cannot supply userId automatically.

#### GET /api/v1/payments/{userId}/{paymentId}/verify

**Purpose:** Authoritatively verify and synchronize payment.

**Controller:** `PaymentController.verify`  
**Module / operation:** Payments and access; CUSTOM.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Moyasar + Database.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |
| paymentId | Integer | Yes | Local Payment ID owned by userId; not the provider UUID. |

**Query parameters / special headers:**

None. No redirect status or frontend payment proof is accepted. This GET synchronizes persistent state.

**Request body:** None.

**Success response:** `PaymentResponseDTO` (direct body). 

```json
{
  "id": 1,
  "serviceType": "COMMUTE_REPORT",
  "amount": 900,
  "currency": "SAR",
  "status": "PENDING",
  "createdAt": "2026-10-21T10:00:00",
  "paidAt": null,
  "accessExpiresAt": null,
  "refundedAmount": 0
}
```

**Success status:** 200.

**Error responses:** 400 missing user/payment; 409 mismatch/legacy/partial capture; 502 provider. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Requires existing user, local paymentId owned by user and trusted checkout snapshot. Fetches stored provider ID; verifies ID, amount, currency, description. Missing provider payment (404 internally) leads to intent lookup, never proof from fulfilled. Expired/canceled unused pending intent becomes FAILED; unknown outcome stays PENDING. Paid/captured success grants one fixed expiry; refunds/voids revoke. Row locks and shared webhook synchronizer prevent repeat grants/regressions.

**Frontend integration notes:** GET has persistent side effects: use no-store. Ignore redirect status as proof. Treat PENDING as pending, not payment failure/success. Legacy rows without trusted data require reconciliation.

#### POST /api/v1/payments/webhook

**Purpose:** Receive authentic provider payment notifications.

**Controller:** `PaymentController.webhook`  
**Module / operation:** Payments and access; CUSTOM.  
**Access context:** C — External provider callback; provider authenticity check, not a frontend call.  
**Dependency:** Moyasar + Database.

**Path parameters:**

None.

**Query parameters / special headers:**

None. Authenticity field is `secret_token` in the provider JSON body, not an invented signature header.

**Request body:** `MoyasarWebhookDTO`; validation in the shared DTO section.

```json
{
  "id": "<event-id>",
  "type": "payment_paid",
  "secret_token": "<provider-configured secret: redacted>",
  "data": {
    "id": "<givenId UUID>",
    "description": "<stored MADAR reference>"
  }
}
```

**Success response:** `ApiResponse` (direct body). 

```json
{
  "message": "Payment notification processed successfully"
}
```

**Success status:** 200.

**Error responses:** 400 malformed; 401 untrusted; 404 local reference absent; 409 mismatch; 502 provider; 503 webhook unconfigured. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** No user path. Configured body secret_token constant-time check; id/type required. Non-payment events ignored; payment events require UUID data.id; non-MADAR description ignored. MADAR reference locates row, fetches canonical payment and uses same synchronizer as verify. Duplicates do not extend pass. Ack after synchronous processing/commit.

**Frontend integration notes:** External provider only; frontend never calls this or knows its secret. Unknown MADAR references and provider delays should be retried by provider, not simulated in the browser.

#### GET /api/v1/payments/{userId}

**Purpose:** Read user payment history.

**Controller:** `PaymentController.getHistory`  
**Module / operation:** Payments and access; CUSTOM.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Database.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |

**Query parameters / special headers:**

| Name | Type | Required | Default | Validation |
|---|---|---|---|---|
| status | String | No | All statuses | Trimmed and uppercased: PENDING, PAID, FAILED, REFUNDED; supplied blank invalid |

**Request body:** None.

**Success response:** `PaymentResponseDTO[]` (direct body). Array elements use the shared DTO fields; the sample illustrates one allowed result state.

```json
[]
```

**Success status:** 200.

**Error responses:** 400 missing user/invalid status. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Checks user, optional status trim+uppercase must be PENDING/PAID/FAILED/REFUNDED. Sorts descending local id, no pagination; [] valid. Includes nullable legacy currency and dates, no sensitive provider payload.

**Frontend integration notes:** History is local state; verify a payment for provider freshness. Do not infer permanent access from PAID.

#### GET /api/v1/payments/{userId}/access/{serviceType}

**Purpose:** Read paid-feature entitlement.

**Controller:** `PaymentController.getAccess`  
**Module / operation:** Payments and access; CUSTOM.  
**Access context:** B — User-scoped; supplied IDs and domain checks, without caller authentication.  
**Dependency:** Database.

**Path parameters:**

| Name | Java type | Required | Meaning / validation |
|---|---|---|---|
| userId | Integer | Yes | Existing local user; ownership is checked only where described below. |
| serviceType | String | Yes | String normalized trim+uppercase; currently only COMMUTE_REPORT. |

**Query parameters / special headers:**

None declared.

**Request body:** None.

**Success response:** `FeatureAccessResponseDTO` (direct body). 

```json
{
  "serviceType": "COMMUTE_REPORT",
  "access": false,
  "expiresAt": null
}
```

**Success status:** 200.

**Error responses:** 400 missing user/unsupported service. See [shared error shapes](#shared-responses-and-errors); statuses emitted through ApiException/ResponseStatusException have `{message}`, while binding/framework failures can differ.

**Business behavior:** Checks user and normalizes serviceType trim+uppercase; only COMMUTE_REPORT supported. Access requires PAID row with provider/local identifiers, currency, paidAt, future accessExpiresAt and no positive refund. Chooses latest expiry, not stacked durations. Sales-disabled config does not revoke an existing pass.

**Frontend integration notes:** Use before commute report; false is a normal200 decision. No frontend flag or pending checkout grants access.


## Geographic search and essentials

### Distinct concepts and persistence

- **PlacePreference** is a fixed commute destination: actual coordinates, name/type label, visit frequency and importance. It is not a generic service-search interest.
- **EssentialInterest** is a user-owned interest: name, searchTerm, CATEGORY/TEXT mode and optional priority. It has a ManyToOne User relation, **not a CurrentHome relation**. Changing/deleting a home does not replace/remove the user's interests.
- **CurrentHome** is at most one row per user. Neighborhood endpoints require non-null movedInAt and usable coordinates. An empty essential-interest list is special: nearest-essential returns [] without demanding a home.

Supported Nearby categories are exactly supermarket, hospital, pharmacy, park, gym, cafe, restaurant, school, shopping_mall. This is the existing provider-category whitelist, **not a restriction on what an essential interest may contain**. A user may store “Jarir,” “car wash,” “specialty coffee equipment,” Arabic business names, or any other nonblank text up to500 characters. The API does not automatically create defaults or force selection.

### Actual search behavior

CATEGORY plus a trimmed searchTerm in the supported set uses Google Places Nearby Search (New), with includedTypes, a circular locationRestriction, rankPreference DISTANCE and maxResultCount10. TEXT, and CATEGORY with an unsupported term, use Text Search (New) with the user's original trimmed query, pageSize20 and a home-centered circular **locationBias**. The query is not silently rewritten to another category.

Both APIs request only places.id, displayName, formattedAddress, location, primaryType and types. No opening hours, rating, photos, contact details, price level, provider next-page token or travel time are returned by these DTOs. No autocomplete endpoint exists.

For text discovery and nearest-essential the service computes Haversine distance using actual returned coordinates, discards invalid/out-of-radius candidates and chooses/sorts matches as described. **Bias does not enforce radius**: the backend distance filter does. A valid farther candidate may never appear in the first provider page; “nearest” is nearest among returned valid matching candidates, not a guarantee of exhaustive global nearest search. Distances are **straight-line meters**. Legacy property near-location uses straight-line kilometers. Only Google Routes commute output represents driving distance/time.

nearest-essential returns one item per saved interest, in priority-descending/null-last/id-ascending order. It caches identical effective method+query searches within one request, including empty/error outcomes, so repeated interests need not trigger duplicate calls. This is not a durable cache and has no cross-user/cross-request reuse. Provider exceptions are represented as SEARCH_FAILED items with null place/distance under HTTP200. NO_MATCH means no qualifying candidate was found, not that the service does not exist in the neighborhood.

A mixed shape example:

```json
[
  {
    "interest": {"id": 1, "name": "Jarir", "searchTerm": "Jarir", "searchMode": "TEXT", "priority": 5},
    "searchMethod": "TEXT",
    "status": "NO_MATCH",
    "found": false,
    "place": null,
    "straightLineDistanceMeters": null
  },
  {
    "interest": {"id": 2, "name": "Pharmacy", "searchTerm": "pharmacy", "searchMode": "CATEGORY", "priority": null},
    "searchMethod": "NEARBY",
    "status": "SEARCH_FAILED",
    "found": false,
    "place": null,
    "straightLineDistanceMeters": null
  }
]
```

For FOUND use the same fields with found=true, an actual GooglePlace object and measured straightLineDistanceMeters. There is no explanatory provider error string in a SEARCH_FAILED item.

### Home overview versus personalized essentials

The overview uses a fixed 2000m radius and the nine existing supported categories. It deduplicates shared places by ID, returns places once, and returns per-category placeIds/returnedCount. Up to nine external requests are made. completeInventory=false is intentional; these are sampled returned results, not category coverage percentages, total counts, quality scores, or an assertion that all essential needs are met. A provider exception aborts the overview with400, unlike nearest-essential's per-interest failures.

confirm-move records server LocalDate.now only if movedInAt is null; repeats keep the original date and unrelated data. confirmedByUserAt is a **creation timestamp assigned by PrePersist**, despite its name. Existing home CRUD also accepts movedInAt, so confirmation is a domain declaration rather than independently verified occupancy. Home coordinates are supplied by the caller; no automatic “select saved listing as home” operation exists.

### Driving report interpretation

calculate-commutes uses a selected property's latitude/longitude as origin, one Google Routes DRIVE/TRAFFIC_AWARE request per saved destination, routes.distanceMeters and routes.duration fields. No departure-time, walking/transit mode, multi-origin matrix, route polyline or departure scheduling parameter is exposed.

One-way distanceKm/durationMinutes are rounded to1 decimal. Weekly minutes sum rounded one-way minutes × visitPerWeek ×2; weekly hours round to2 decimals. The score is a weighted average of clamp(100 − (durationMinutes−15) ×100/60, 0,100), using importance × visitPerWeek, rounded to2 decimals. It is MADAR's commute suitability score, **not a neighborhood/property quality score**. A nonpositive total weight fails. CRUD's visitPerWeek lacks a lower bound; checkout validates usable destinations, but later edits can still invalidate a report. Times are provider estimates, not guaranteed observed travel durations.


## Payments and the paid commute flow

### Implemented offer and access

| Service | Delivered feature | Default configured price | Access rule | Dependencies |
|---|---|---|---|---|
| COMMUTE_REPORT | Existing personalized driving-distance/time, weekly commute estimate and weighted commuteScore | 900 halalas = **SAR9**, provisional configurable product assumption | 24-hour time pass from first authoritative successful synchronization; repeat calculations during that interval, no usage counter/subscription | Existing user, valid saved commute destinations, property coordinates, Google Routes, Moyasar configuration |

These are source configuration defaults, **not verified market prices or guaranteed deployment settings**. PaidServiceProperties and the existing paid-services configuration hold enabled/amount-halalas/currency/access-hours centrally. No catalog/pricing endpoint exposes current settings or access duration. Checkout returns its authoritative amount/currency; the UI must not hardcode SAR9 or assume24h is immutable. Feature-access/verified payment returns actual expiration; a backend configuration change does not rewrite an attempt's captured amount/duration. Basic public discovery, details, saving, housing setup, ordinary neighborhood exploration and essential interests remain free.

Only the commute-analysis controller calls requireCommuteAccess; saved comparison pairs do not deliver a separate paid advanced report. No other paid service, subscription, usage bucket or permanent entitlement is implemented. Turning off new sales does not automatically revoke an already active valid pass.

### Recommended frontend request sequence

1. Obtain an **existing local user ID by an agreed external flow**. Current registration returns only a success message and no ID/token; there is no login/me endpoint to finish a normal account bootstrap. Do not invent one or scrape admin listings.
2. Load/save commute destinations, obtain selected property coordinates, and call `GET /api/v1/payments/{userId}/access/COMMUTE_REPORT`.
3. If access=false, initiate checkout with JSON `{"serviceType":"COMMUTE_REPORT"}` and a new canonical UUID in `Idempotency-Key`. Do not send amount, currency, success flags, card details or an arbitrary provider ID. Preserve the same key for retries of this logical request.
4. Use the returned intentId/clientSecret with the provider's appropriate frontend fulfillment integration. Pass **given_id=givenId**, and the returned metadata keys madar_payment_id, user_id, service_type. This is necessary because MADAR reserves that payment UUID and verifies against it. Card information goes to Moyasar, not MADAR.
5. Persist only the local numeric paymentId and non-sensitive navigation state as needed. A return/redirect is not proof of payment. Call `GET /api/v1/payments/{userId}/{paymentId}/verify` with an uncached request, then access again. PENDING requires a pending UI, not a paid success page. Use bounded/manual refresh rather than unbounded provider polling.
6. Once access=true, call `GET /api/v1/place-preference/calculate-commutes/{userId}?latitude=...&longitude=...`. 402 means a pass is absent/expired/revoked. 400 may mean setup, coordinate, weight or provider problems. A paid pass does not guarantee valid report inputs or an available route.
7. Read `GET /api/v1/payments/{userId}` for local history; filter with status=paid if desired. It is not automatically synchronized with provider state on every read.

The backend does not return a hosted checkout URL, frontend public key, payment-method catalog, or ready-made frontend form. Provider UI/SDK fulfillment and any required publishable-key configuration must be completed separately using the compatible provider contract. No new MADAR fulfillment endpoint should be invented. Backend callback URL is server-configured and must be HTTPS for checkout; the current code does not expose it as a frontend-editable request field.

### Retry and synchronization boundaries

- Checkout snapshots backend amount, currency, duration and MADAR description reference, allocates local payment ID plus provider givenId, persists PENDING, then creates a Payment Intent. No funds are charged by this documentation audit.
- A canonical UUID idempotency key is normalized and unique across checkout records. Another user/service cannot reuse it. Retrying the same usable pending attempt returns the existing checkout information (still201); a completed/expired/used intent returns409.
- A failed/uncertain provider creation can leave a persisted local attempt with no provider intent. Reusing its key returns503 rather than creating a second intent. Do not silently spin new keys to hide uncertainty; reconciliation may be needed.
- Checkout validates configured service/price/currency/duration, HTTPS callback and webhook secret; missing/disabled/invalid setup can return503. It rejects a new purchase when local access is already active. It also checks usable destinations so it does not charge for an undeliverable empty setup.
- Manual verify and webhook share synchronizePayment, row locks and canonical provider fetches. Matching provider ID, amount, currency and local description is mandatory. A fulfilled intent by itself is **not proof of success**.
- First confirmed paid/captured result sets paidAt and accessExpiresAt once. A fully captured amount is required; partial capture yields409. Repeated checks/events do not extend expiry. Overlapping passes, if present, choose the latest expiration; durations are not stacked.
- Any positive refund records REFUNDED and revokes the simple pass, including partial refunds. Voided paid results revoke it. Refund is terminal; stale pending/failure notifications do not regress a paid result. A previously paid then voided attempt cannot be reactivated by a later paid observation.
- Provider paid/captured maps to PAID, failed/voided/expired to FAILED, initiated/authorized/verified to PENDING, and positive refund/refunded to REFUNDED; unknown/inconsistent provider states are errors, not success. These are internal synchronization rules, not client-supplied statuses.
- If no provider payment yet exists at the reserved UUID, verify inspects its stored intent. A canceled intent or expired created intent can turn an unused pending attempt FAILED; fulfillment alone leaves it pending until a valid payment is fetched.
- Legacy Payment rows missing trusted provider references/currency/duration cannot be verified into access; they need reconciliation and may return409. Do not reinterpret a legacy amount with missing currency.
- History and access read local state, not live provider state. Webhooks/verify provide freshness; revoke/expiry may require invalidating cached frontend queries.

Checkout alone explicitly sets `Cache-Control: no-store`. Verify is a GET with database side effects but **does not set that header in the controller**. The frontend/server data layer must opt out of caching verify and other user-specific sensitive payment results, and avoid prefetching verify links.

### Webhook is not a frontend endpoint

The actual authenticity mechanism is the configured provider body `secret_token`, compared using MessageDigest.isEqual. No invented signature/HMAC header is used. With no configured secret the handler fails503; a missing/wrong secret fails401. Required event id/type are checked; non-payment events and non-MADAR references are acknowledged without granting access. Relevant payment events trigger a canonical provider payment fetch; incoming status/amount fields are never authoritative.

The implementation matches event type prefix payment_, including provider spelling variations, rather than maintaining a strict client-visible event enum. The local MADAR reference identifies the record; provider data must still match all trusted fields. Duplicate deliveries are processed safely by state logic, not an event-ID deduplication table. Unknown MADAR reference404, mismatch409 or provider visibility/fetch502 are not successful acknowledgments. The frontend must never know the webhook secret or send mock success callbacks.

There is no frontend refund API, cancellation API, subscription API, payment-success query endpoint, pricing catalog endpoint, or downloadable stored report endpoint. Do not design buttons as if those capabilities exist.


## Frontend Feature → Backend Endpoint Mapping

All paths in this table begin with /api/v1. Detailed contracts above remain authoritative about body/status. “User ID” is a data dependency, not authenticated identity.

| Frontend feature | Endpoint(s) | Inputs / dependencies | Recommended sequence | Loading, empty, and error states / gaps |
|---|---|---|---|---|
| Public homepage | GET /properties/search | Mandatory city; optional purpose defaults rent | Choose city → search → render data as cards | City selection before request; spinner;200 empty data;400 validation;429 retry state;502 provider unavailable. No anonymous nationwide feed. |
| Search/filter page | GET /properties/search | URL query state, supported filter literals | Parse/validate URL → forward only API keys → preserve filters with nextCursor → reset cursor on changes | Disable next on window limit/no cursor; do not display invented total/page count; no region or district-name query. |
| Property cards | Same search or legacy PropertyDTO[] | Nullable title/price/images/location, source/externalId | Render fallbacks for unknown fields → details link using encoded source/ID | No coordinates means no map/commute action. No usable ID means no save/details action. Show period with price. |
| Public property details | GET /properties/get/{source}/{externalId} | source=KITE; provider external ID string | Fetch directly without user setup |400 can mean unavailable/removed or provider failure; no guaranteed404. Attribution/original URL may be null. |
| Related listings | GET /properties/similar/{source}/{externalId} | Base listing city/purpose/type/price | Details → similar candidates | First residential page, not an AI relevance score; unsupported commercial types can fail. |
| Map candidate discovery | GET /properties/near-location/{city}/{listingType}/{propertyType}/{latitude}/{longitude}/{radiusKm} | Legacy city/residential type, Saudi coordinate bounds, radius<=50km | Select map center → load bounded candidate page | No cursor/exhaustive radius guarantee. Distances straight-line. No map-tile or clustering endpoint. |
| Market/asking price context | GET /properties/price-stats/{city}/{listingType}/{propertyType}; GET /properties/results-count/{city}/{listingType} | Single residential type for stats; city/purpose | Optional separate request after city selection | No appraisal/median/transaction history; nullable extrema; count not matched new-search total. Calls can consume several Kite requests. |
| Registration/profile | POST /user/register; GET /user/get/{userId}; PUT /user/update/{userId}; DELETE /user/delete/{userId} | Full form; existing user ID for profile | Registration submits form; profile fetch/update only after externally obtaining ID | **Gap:** registration returns no ID/session; no login/me endpoint. PUT requires password; deletion can fail FK constraints. |
| Housing preferences | GET /housing-preference/get-by-user/{userId}; POST /housing-preference/add/{userId}; PUT /housing-preference/update/{userId}/{preferenceId}; DELETE /housing-preference/delete/{userId}/{preferenceId} | User, six housing fields; local preferenceId for edit | GET → setup if absent → add/update → refetch |400 absence; one row/user; housing city regex differs from public search; commercial types unsupported here. |
| Personalized listings | GET /properties/by-preferences/{userId}; GET /properties/within-budget/{userId}; GET /properties/under-budget-margin/{userId}/{margin}; GET /housing-preference/match-summary/{userId} | Existing housing setup; margin is SAR | Load preference → recommendations and optional counts | First residential page; no commute/essential ranking; no preference =>400; no match percentage. |
| Commute destination forms | GET /place-preference/get/{userId}; POST /place-preference/add/{userId}; PUT /place-preference/update/{userId}/{placeId}; PATCH /place-preference/importance/{userId}/{placeId}/{importance}; DELETE /place-preference/delete/{userId}/{placeId} | Actual destination coordinates, name/type, importance, visits | GET → add destinations → refetch for local IDs | Empty is400. No autocomplete/geocoding/address-to-coordinate endpoint; frontend must obtain reliable coordinates separately. |
| Paid property commute report | GET /payments/{userId}/access/COMMUTE_REPORT; POST /payments/{userId}/checkout; GET /payments/{userId}/{paymentId}/verify; GET /place-preference/calculate-commutes/{userId} | User, saved destinations, property latitude/longitude, provider fulfillment | Setup → access → purchase if needed → verify/access → calculate |402 pass missing; pending/expired/refunded states; provider failure even with paid pass; no stored downloadable report. |
| Essential-interest settings | GET /essential-interest/get/{userId}; POST /essential-interest/add/{userId}; PUT /essential-interest/update/{userId}/{interestId}; DELETE /essential-interest/delete/{userId}/{interestId} | User, arbitrary name/searchTerm, mode, optional priority | Load[] → edit multiple interests → refetch | No forced defaults; custom interests are not limited to category list; homes/commute setup unnecessary. |
| Current-home setup | GET /current-home/get-by-user/{userId}; POST /current-home/add/{userId}; PUT /current-home/update/{userId}/{homeId}; DELETE /current-home/delete/{userId}/{homeId}; POST /current-home/{userId}/confirm-move | User, actual coordinates, optional listing reference/date | Load → create/update → confirm move → refetch | Missing home400; one/home/user; no automatic saved-property selection; date gate must be respected. |
| Current-home dashboard | GET /current-home/{userId}/neighborhood; GET /current-home/{userId}/nearest-essential | Confirmed home, interests for personalized list | Load home → prompt confirmation if needed → request overview and essentials independently | Overview all-or-error; essentials[] without interests; per-interest SEARCH_FAILED/NO_MATCH under200. Counts are samples. |
| Neighborhood category/text browse | GET /current-home/{userId}/nearby-by-category; GET /current-home/{userId}/nearby-search; public alternative GET /place-preference/nearby-services | Home for scoped routes; world coordinates for public route | Choose category or enter text → search with radius | No category distance field; text has measured straight-line distance; Arabic/English unchanged. Provider limited candidates, no exhaustive claims. |
| Saved/favorite listings | GET /saved-property/get/{userId}; POST /saved-property/add/{userId}; DELETE /saved-property/delete/{userId}/{savedPropertyId} | User, source/externalPropertyId; local saved ID for delete | Save card → refetch references → fetch current details as needed | Empty400; duplicates400; stale titleSnapshot/listing removed possible; save does not set home. No batch details endpoint, avoid excessive eager calls. |
| Comparison list/details | GET /property-comparison/get-by-user/{userId}; GET /property-comparison/get-by-id/{userId}/{comparisonId}; POST /property-comparison/add/{userId}; PUT /property-comparison/update/{userId}/{comparisonId}; DELETE /property-comparison/delete/{userId}/{comparisonId} | Two distinct source/ID pairs, local comparison ID | Store pair → list/refetch → details request per property → render supported attributes |[] valid; duplicate reverse pair400. **Gap:** no computed advanced comparison, winner, valuation or AI result. |
| Purchase history | GET /payments/{userId}?status=...; GET /payments/{userId}/{paymentId}/verify; GET /payments/{userId}/access/{serviceType} | Existing user, optional local status, numeric payment ID | Read history → verify selected uncertain attempt → refresh access/history | No pagination; local state may be stale; missing legacy currency; PAID alone not permanent entitlement. |
| Global/admin tooling | /user/admin/* plus GET /housing-preference/get, /current-home/get, /property-comparison/get | Supplied stored ADMIN ID only on explicit user admin routes | Restrict frontend exposure by product policy; backend security remains a gap | Global reads unguarded; no trustworthy authorization. Never use them to discover normal user's ID after registration. |
| Provider event processing | POST /payments/webhook | Provider-configured secret and event payload | Provider → backend canonical fetch/sync | Not a frontend feature; UI observes verify/access/history instead. |

Frontend rendering should not infer resource state from only HTTP success. In particular, a successful mutation still needs a GET to obtain IDs/current values; a successful nearest-essential call may contain failed searches; a successful checkout does not grant a pass; a locally PAID row can be expired.


## Integration risks and missing capabilities

These are findings, not changes implemented by this audit.

1. **No trusted user identity.** User-scoped IDs can be substituted; stored-role lookup for adminId is impersonable. Global home/preference/comparison reads have no guard. This document's access classes describe intent/data dependencies, not deployed authorization.
2. **Account bootstrap is incomplete.** Registration returns200/message only. No login/session/token/me/current-user lookup or public email lookup exists. LoginDTO/ChangePasswordDTO are empty and unused; they are not evidence of routes. The frontend must flag this gap rather than pretend registration signs a user in.
3. **Existing password handling is unsuitable for a real login flow.** UserService stores/copies raw password values and contains a hashing TODO. Full user update validation requires a compliant password even for ordinary profile edits. Never echo the password from a response or invent a change-password operation.
4. **Browser access is deployment-dependent.** No source CORS policy; Next.js browser cross-origin calls may fail. No backend base URL, production origin, proxy configuration or deployment TLS behavior can be established from controller code.
5. **Inconsistent API ergonomics.** No universal success/error envelope; mostly400 for missing rows, some missing collections400, others[]; 200/201 creates vary. Error messages can include SQL/runtime/provider details. Do not hardcode a single unwrap/error parser or use every400 as absence.
6. **Provider data is nullable.** Missing listing title, coordinates, photos, source links, price, bathrooms and provider timestamps require UI fallbacks. No field-mask request supplies unlisted Google details. No guarantee of complete Google/Kite result inventories.
7. **Kite bounds differ across flows.** New search requires city, defaults rent, supports cursor/commercial types. Older search/recommendation endpoints fetch one fixed page and filter residential entries after retrieval. Legacy map/radius/district/similar operations are candidate views, not complete paginated search. Legacy errors flatten rate limits to400; public search preserves429. No quota or configured retry/backoff guarantees.
8. **No lookup endpoints for some frontend forms.** Kite has an internal neighborhoods client method, but no public city or neighborhood catalog route is exposed. No general place autocomplete or address geocoding endpoint exists. Do not invent catalog paths. Public-search neighborhood filtering needs an already known provider ID.
9. **Search inputs are not uniform.** Public city regex permits underscores; HousingPreference city regex permits hyphens instead. Public query enums are lowercase/exact; several legacy path checks are case-insensitive. Source normalization differs between saved properties and comparison pairs. Do not reuse one form validator blindly across modules.
10. **Numeric/legacy issues remain.** Preference budgets are truncated with BigDecimal.intValue in property/match-summary logic (large values can overflow); null cheapest-listing price can cause a runtime400; absent count payload may become0. Legacy String.valueOf null ID becomes "null". These are not promises of meaningful zero data.
11. **Destination edits can invalidate purchased analysis.** visitPerWeek lacks Min validation in CRUD; legacy score weighting multiplies integer values. Checkout performs usable-input checks but subsequent changes can invalidate reports; extreme integer inputs can overflow weighting. A pass is not a report-delivery guarantee.
12. **Home confirmation is writable state.** movedInAt is both the gate and an ordinary home form property. confirmedByUserAt is assigned at creation. No independent residence verification exists. Interests remain attached to the user across home changes.
13. **Mass entity binding and generated fields.** Controllers accept JPA entities for many forms. CurrentHome/HousingPreference/PropertyComparison creation does not explicitly clear a caller-supplied id, so the frontend must omit IDs/server fields; this is not an authorization guarantee. Other resource creation services clear IDs as described. No application code was changed to address this.
14. **Deletion dependencies.** User cascades most child resources but not PropertyComparison; users with comparisons may hit FK/data-integrity400 on deletion. Do not promise all user deletion paths succeed.
15. **Personalization is narrower than a complete recommendation engine.** Existing recommendation endpoints use housing filters/budget/district. They do not rank by essential interests or commute results automatically. Match summary is count/cheapest statistics. Comparison CRUD stores reference pairs only; no computed paid advanced comparison or AI analysis endpoint.
16. **Payment deployment and client integration remain prerequisites.** Provider configuration, secret, HTTPS callback and frontend intent fulfillment are required; there is no backend hosted checkout URL/form or publishable-key endpoint. Checkout only explicitly sets no-store; frontend must avoid caching verification/user-specific payment state. Pending and uncertain attempts require careful UI, not repeated new purchases.
17. **Paid access has time/refund semantics.** Only COMMUTE_REPORT exists; default9SAR/24h is configurable and not a public pricing catalog. History/access are local; stale states and legacy untrusted attempts can require reconciliation. Any refund revokes this simple pass; there is no frontend refund management operation or subscription. Do not sell an unsupported comparison feature.
18. **Documentation is not runtime evidence.** Source contracts, nullable Java shapes, configured defaults and controller statuses were inspected; application startup, database schema contents, external contracts at runtime, deployment behavior and serialization were not executed. This reference must not be described as production certification.

### Existing documentation versus source

Existing docs are useful context but are not additive endpoint declarations. `docs/public-property-search.md` describes the query route and native provider constraints; the actual PropertySearchRequestDTO/service define the exact current query keys, enum aliases and defaults. `docs/essential-interests.md` provides the personalized essentials context; nearest-essential is driven by persisted user interests rather than an obligatory fixed list. `docs/current-home-payments.md` covers the earlier current-home/payment work; its historical “before edits” repository findings describe the earlier implementation, not current missing routes. Its broad statement that neighborhood reads require a confirmed home has an explicit source-level exception: nearest-essential returns [] immediately when the user has no interests, without requiring a home.

When documentation refers to “user access,” “admin,” “confirmation,” or “nearest,” interpret those words using the actual checks above: IDs are not authentication, a stored role supplied by URL is not trusted caller authorization, movedInAt is the gate, and nearest means nearest matching returned candidate. No endpoint was added to fulfill a documentation suggestion.


## Source coverage and internal DTOs

### Source-of-truth ledger

The audit covered the complete relevant application source, not just controller annotations:

- `pom.xml`: Spring MVC, validation, JPA, Lombok, external HTTP/AI dependencies; no introduced security or documentation dependency.
- `src/main/java/com/example/madar/Controller/`: all nine controllers in the inventory; resolved every class/method mapping and inspected response constructors/messages/statuses.
- `Service/`: CurrentHomeService, EssentialInterestService, HousingPreferenceService, PaymentService, PlacePreferenceService, PropertyComparisonService, PropertyService, SavedPropertyService, UserService; read prerequisites, provider calls, mutations and returned types.
- `Repository/`: all eight repositories; user lookups, ownership predicates, sorting, duplicate-pair/reference queries, unique-one-home/preference relationships and payment row/user locks.
- `Model/`: all eight entities; bean validation, relationships, Jackson ignore/write-only annotations and lifecycle timestamps. No locally persisted Property listing entity.
- `DTO/In/`, `DTO/Out/` and `Api/`: all input/output classes/records and nested records used above; empty auth DTOs and internal provider DTOs separately identified.
- `Advice/AdviceController.java`: all exception handlers, including raw-string responses.
- `Client/`: KiteClient, GooglePlacesClient, GoogleRoutesClient, MoyasarClient and OpenRouterClient; provider URI/body/mask/error mapping and integration boundaries.
- `Config/PaidServiceProperties.java`, application properties, application entrypoint and repository documentation/HTTP examples: settings affecting pricing, provider setup and API behavior, without reproducing secret values.
- No additional mapped interface controller, CORS policy or authentication infrastructure was found. `CurrentHomeService.isConfirmed` is a service helper, not an HTTP route. OpenRouterClient constructs an AI ChatClient but exposes no REST operation.

Paths abbreviated above are under `src/main/java/com/example/madar/`. This file is portable; backend source access is not needed to consume the contracts.

### Internal provider DTO coverage — not frontend response contracts

These classes exist in the repository but are transformed or consumed internally. Do not send them as MADAR request bodies or assume their snake_case fields appear on PropertyDTO.

| Java type | Fields / wire mapping | Use |
|---|---|---|
| KiteDTO.ListResponse | data: Listing[] nullable; pagination: Pagination nullable | Provider page; new public path validates page completeness |
| KiteDTO.Pagination | limit: Integer; next_cursor: String; has_more: Boolean; result_window_reached: Boolean | Mapped to camelCase public pagination |
| KiteDTO.SingleResponse | data: Listing | Details response |
| KiteDTO.CountResponse / Count | data: Count; total: Integer | Counts; absent payload may yield0 in legacy services |
| KiteDTO.Listing | id: Long; url/title/headline/description: String; listing_type/property_type: String; price: Price; bedrooms/bathrooms: Integer; area_sqm: Double; location: Location; images: String[]; source: Source; updated_at: String | Nullable provider record, mapped to PropertyDTO |
| KiteDTO.Price / PostedPrice | yearly_sar: Integer; as_posted: {amount: Long, frequency: String} | Normalized vs advertised price |
| KiteDTO.Location | city: String; neighborhood_id: Integer; neighborhood_name_ar: String; lat/lng: Double | Public location mapping |
| KiteDTO.NeighborhoodsResponse / Neighborhood | data: {id: Integer, name_ar: String, name_en: String}[] | Internal named-district resolution, not an exposed catalog route |
| KiteDTO.Source | name: String; url: String | Original source attribution |
| GoogleRouteResponseDTO / Route | routes: {distanceMeters: Integer, duration: String}[] | First driving route; duration parsed as seconds string and mapped to CommuteResponseDTO |
| MoyasarIntentDTO | id/status/description: String; amount: Integer; currency: String; client_secret: String; expires_at: OffsetDateTime | Backend create/get intent; not returned raw |
| MoyasarPaymentDTO | id/status/currency/description: String; amount/refunded/captured: Integer | Canonical provider verification, never a frontend payment proof body |
| LoginDTO / ChangePasswordDTO | Empty classes | Unused; no login/password route |
| Payment entity | User association, serviceType, amount/currency/status, timestamps, provider intent/payment references, localReference, checkoutKey, duration and refund data | Internal persistence; only PaymentResponseDTO is returned for history/verification |
| PaidServiceProperties.Definition | enabled, amountHalalas, currency, accessHours | Server configuration, not a REST pricing catalog |

Kite DTOs and payment provider DTOs ignore unknown provider fields where annotated. Nested provider wrapper fields can be absent/null; public-search validation and service checks decide whether that becomes an error or normalized output. The frontend-facing DTO reference includes every actual response/request DTO and entity-serialized resource in the61 operations; internal-only classes above explain why they are not additional frontend interfaces.

### Endpoint coverage summary

| Controller | Base mapping | Operations |
|---|---|---:|
| PropertyController | /api/v1/properties | 13 |
| UserController | /api/v1/user | 7 |
| HousingPreferenceController | /api/v1/housing-preference | 6 |
| PlacePreferenceController | /api/v1/place-preference | 7 |
| EssentialInterestController | /api/v1/essential-interest | 4 |
| CurrentHomeController | /api/v1/current-home | 10 |
| SavedPropertyController | /api/v1/saved-property | 3 |
| PropertyComparisonController | /api/v1/property-comparison | 6 |
| PaymentController | /api/v1/payments | 5 |
| **Total** | **9 controllers** | **61** |

No application source/configuration/dependency files were changed. No endpoints, authentication infrastructure, tests or runtime requests were added or executed. This document is the only audit deliverable.

