# MADAR API endpoint inventory

## Scope and conventions

Audit source: Spring MVC controllers and service/model implementations in this checkout. There are **31 implemented mappings** under `/api/v1`. No controller for `/api/test` exists. No class-level or method-level security, authentication filter, CORS configuration, base server port, or context path was found. Unless otherwise noted, requests with bodies use `Content-Type: application/json`; no endpoint accepts multipart data or query parameters. Path IDs are Java `Integer` values. Responses are not wrapped consistently: reads return entity/list JSON and writes generally return `{ "message": "..." }`.

The examples below are illustrative. Model fields in responses are direct entity serialization with `user` relationships ignored; generated IDs and timestamps are database/runtime dependent.

## Summary

| Method | Endpoint | Purpose | Auth | Controller |
|---|---|---|---|---|
| POST | `/api/v1/user/register` | Register user | None implemented | `UserController` |
| GET | `/api/v1/user/get/{userId}` | Read user | None implemented | `UserController` |
| PUT | `/api/v1/user/update/{userId}` | Update user fields | None implemented | `UserController` |
| DELETE | `/api/v1/user/delete/{userId}` | Delete account | None implemented | `UserController` |
| GET | `/api/v1/user/admin/get-all/{adminId}` | List users (admin ID checked in service) | None implemented; ID/role check only | `UserController` |
| PUT | `/api/v1/user/admin/update/{adminId}/{userId}` | Admin update account | None implemented; ID/role check only | `UserController` |
| DELETE | `/api/v1/user/admin/delete/{adminId}/{userId}` | Admin delete account | None implemented; ID/role check only | `UserController` |
| GET | `/api/v1/current-home/get` | List all current homes | None implemented | `CurrentHomeController` |
| GET | `/api/v1/current-home/get-by-user/{userId}` | Read current home | None implemented | `CurrentHomeController` |
| POST | `/api/v1/current-home/add/{userId}` | Create current home | None implemented | `CurrentHomeController` |
| PUT | `/api/v1/current-home/update/{userId}/{homeId}` | Replace current-home fields | None implemented | `CurrentHomeController` |
| DELETE | `/api/v1/current-home/delete/{userId}/{homeId}` | Delete current home | None implemented | `CurrentHomeController` |
| GET | `/api/v1/housing-preference/get` | List all preferences | None implemented | `HousingPreferenceController` |
| GET | `/api/v1/housing-preference/get-by-user/{userId}` | Read one user preference | None implemented | `HousingPreferenceController` |
| POST | `/api/v1/housing-preference/add/{userId}` | Create preference | None implemented | `HousingPreferenceController` |
| PUT | `/api/v1/housing-preference/update/{userId}/{preferenceId}` | Replace preference fields | None implemented | `HousingPreferenceController` |
| DELETE | `/api/v1/housing-preference/delete/{userId}/{preferenceId}` | Delete preference | None implemented | `HousingPreferenceController` |
| GET | `/api/v1/place-preference/get/{userId}` | List user places | None implemented | `PlacePreferenceController` |
| POST | `/api/v1/place-preference/add/{userId}` | Add place | None implemented | `PlacePreferenceController` |
| PUT | `/api/v1/place-preference/update/{userId}/{placeId}` | Replace place fields | None implemented | `PlacePreferenceController` |
| DELETE | `/api/v1/place-preference/delete/{userId}/{placeId}` | Delete place | None implemented | `PlacePreferenceController` |
| PATCH | `/api/v1/place-preference/importance/{userId}/{placeId}/{importance}` | Set importance | None implemented | `PlacePreferenceController` |
| GET | `/api/v1/saved-property/get/{userId}` | List saved properties | None implemented | `SavedPropertyController` |
| POST | `/api/v1/saved-property/add/{userId}` | Save property reference | None implemented | `SavedPropertyController` |
| DELETE | `/api/v1/saved-property/delete/{userId}/{savedPropertyId}` | Remove saved reference | None implemented | `SavedPropertyController` |
| GET | `/api/v1/property-comparison/get` | List all comparisons | None implemented | `PropertyComparisonController` |
| GET | `/api/v1/property-comparison/get-by-user/{userId}` | List user comparisons | None implemented | `PropertyComparisonController` |
| GET | `/api/v1/property-comparison/get-by-id/{userId}/{comparisonId}` | Read user comparison | None implemented | `PropertyComparisonController` |
| POST | `/api/v1/property-comparison/add/{userId}` | Create property-ID pair | None implemented | `PropertyComparisonController` |
| PUT | `/api/v1/property-comparison/update/{userId}/{comparisonId}` | Replace property-ID pair | None implemented | `PropertyComparisonController` |
| DELETE | `/api/v1/property-comparison/delete/{userId}/{comparisonId}` | Delete comparison | None implemented | `PropertyComparisonController` |

## User — `UserController`

All methods delegate to the corresponding method on `UserService`. Password is write-only in Jackson: accepted in input, omitted from JSON responses. All successful write responses below are JSON `ApiResponse` objects (`{"message":"..."}`), except registration and saved-property add use HTTP 200.

### `POST /api/v1/user/register`

Body: `User` fields `fullName`, `email`, `password`, `role`; role is required by Bean Validation but service overwrites it to `USER`. Constraints are in [API_SCHEMAS.md](API_SCHEMAS.md). Service nulls incoming ID. Success 200: `{"message":"User registered successfully"}`. Duplicate email produces 400 `{"message":"Email is already registered"}`. Invalid model produces 400 message with the first validation field error.

```http
POST /api/v1/user/register
Content-Type: application/json
```
```json
{"fullName":"Rana Sample","email":"rana@example.test","password":"Example!Pass8","role":"USER"}
```

### `GET /api/v1/user/get/{userId}`

Returns `User` JSON (id, fullName, email, role, createdAt; password and relationships omitted). 200 on success; unknown ID is 400 `{"message":"User not found"}`. Example: `GET /api/v1/user/get/12`.

### `PUT /api/v1/user/update/{userId}`

Body: validated `User`. Service changes only fullName, email, and password; role and ID in body do not alter the stored account. Missing user or email collision: 400. Success 200 `{"message":"Account updated successfully"}`. Example body uses the registration shape; `role` remains required by validation although ignored for this operation.

### `DELETE /api/v1/user/delete/{userId}`

Deletes the account by ID; service-level cascading is configured for several owned entities. Success 200 `{"message":"Account deleted successfully"}`; missing user 400. Example: `DELETE /api/v1/user/delete/12`.

### `GET /api/v1/user/admin/get-all/{adminId}`

Service loads `adminId` and checks persisted role equals `ADMIN`, then returns `List<User>`; each object omits password and relationships. 200 success; unknown admin or non-admin gives 400. This is not authentication: the caller supplies the ID in the URL.

### `PUT /api/v1/user/admin/update/{adminId}/{userId}`

Admin ID/role checked in service. Body is validated `User`; only fullName, email, password are copied, so role cannot be changed through this operation. 200 message on success; 400 for admin/user missing or email collision.

### `DELETE /api/v1/user/admin/delete/{adminId}/{userId}`

Admin ID/role checked in service. Admin cannot delete itself through this route. 200 message on success; failures are 400 message objects.

## Current home — `CurrentHomeController`

`CurrentHomeService` stores latitude/longitude and optional external listing reference. JSON omits the owning `user` relation.

### `GET /api/v1/current-home/get`

Returns `CurrentHome[]`, including an empty JSON array when no rows exist. No owner filter. 200.

### `GET /api/v1/current-home/get-by-user/{userId}`

Returns one `CurrentHome`. Unknown user or no current home becomes 400 message object. Example: `GET /api/v1/current-home/get-by-user/12`.

### `POST /api/v1/current-home/add/{userId}`

Validated `CurrentHome` JSON; `latitude` and `longitude` required. Service associates it with user and rejects users already having a home. 201 `{"message":"Current home added successfully"}`; user missing or duplicate home 400.

```json
{"latitude":24.7136,"longitude":46.6753,"externalPropertyId":"listing-204","source":"kite","movedInAt":"2025-02-01"}
```

### `PUT /api/v1/current-home/update/{userId}/{homeId}`

Validated full model body; service copies latitude, longitude, externalPropertyId, source, movedInAt. `id`, `confirmedByUserAt`, and user are not updated from body. 200 message. Missing or wrong-owner records return 400 message.

### `DELETE /api/v1/current-home/delete/{userId}/{homeId}`

Deletes only after checking record ownership. 200 message; missing user/home or owner mismatch 400.

## Housing preference — `HousingPreferenceController`

### `GET /api/v1/housing-preference/get`

Returns all `HousingPreference[]`, unfiltered, possibly `[]`. 200.

### `GET /api/v1/housing-preference/get-by-user/{userId}`

Returns one preference; user missing or preference absent yields 400 message object.

### `POST /api/v1/housing-preference/add/{userId}`

Validated `HousingPreference` JSON. One preference per user; 201 message on success, 400 if user missing or already has preference.

```json
{"region":"Riyadh Region","city":"Riyadh","district":"Al Olaya","maxBudget":850000,"propertyType":"apartment","listingType":"sale"}
```

### `PUT /api/v1/housing-preference/update/{userId}/{preferenceId}`

Validated full body; service copies region, city, district, maxBudget, propertyType, listingType. 200 message; missing IDs or wrong owner 400.

### `DELETE /api/v1/housing-preference/delete/{userId}/{preferenceId}`

Deletes owned preference. 200 message; missing user/preference or wrong owner 400.

## Place preference — `PlacePreferenceController`

### `GET /api/v1/place-preference/get/{userId}`

Returns `PlacePreference[]`; empty list is not returned as `[]`: service raises 400 `{"message":"No places found for this user"}`. User missing also 400.

### `POST /api/v1/place-preference/add/{userId}`

Validated place body. Service associates owner and clears supplied ID. 200 message (not 201). `name`, `type`, coordinates, `importance`, `visitPerWeek` are required; see schema.

```json
{"name":"Office","type":"work","latitude":24.711,"longitude":46.674,"importance":4,"visitPerWeek":5}
```

### `PUT /api/v1/place-preference/update/{userId}/{placeId}`

Validated full body; service copies all six business fields. 200 message. Missing place/owner mismatch is 400 message.

### `DELETE /api/v1/place-preference/delete/{userId}/{placeId}`

Deletes after owner check. 200 message; missing or mismatch 400.

### `PATCH /api/v1/place-preference/importance/{userId}/{placeId}/{importance}`

No body. `importance` is integer path segment; service accepts 1–5 and returns 200 message. Invalid range, missing place, or owner mismatch yields 400. A non-integer path segment is handled as type mismatch 400.

## Saved property — `SavedPropertyController`

This feature stores external property ID/source and optional title snapshot; it does not retrieve property details.

### `GET /api/v1/saved-property/get/{userId}`

Returns `SavedProperty[]`; no matches yields 400 message, not an empty array. Unknown user 400.

### `POST /api/v1/saved-property/add/{userId}`

Body requires `externalPropertyId` and `source`; `titleSnapshot` optional/null. Service clears input ID, associates user, rejects duplicate `(user, source, externalPropertyId)`. Success 200 `{"message":"Property saved successfully"}`; errors 400.

```json
{"externalPropertyId":"listing-204","source":"kite","titleSnapshot":"Two bedroom apartment"}
```

### `DELETE /api/v1/saved-property/delete/{userId}/{savedPropertyId}`

Deletes only if owner matches. 200 message; missing or wrong owner 400.

## Property comparison — `PropertyComparisonController`

Comparisons contain references only; no external listing is fetched or compared by the backend.

### `GET /api/v1/property-comparison/get`

Returns all `PropertyComparison[]`, unfiltered, possibly empty. 200.

### `GET /api/v1/property-comparison/get-by-user/{userId}`

Returns user comparison list; unknown user 400, empty list is `[]`. 200.

### `GET /api/v1/property-comparison/get-by-id/{userId}/{comparisonId}`

Returns one comparison. Missing pair gives 400 `{"message":"Comparison not found for this user"}`.

### `POST /api/v1/property-comparison/add/{userId}`

Body requires `firstPropertyId`, `secondPropertyId`, `firstPropertySource`, `secondPropertySource`. Rejects same listing and duplicates in either order for that user. Success 201 message; validation/business errors 400.

```json
{"firstPropertyId":"listing-204","firstPropertySource":"kite","secondPropertyId":"listing-917","secondPropertySource":"kite"}
```

### `PUT /api/v1/property-comparison/update/{userId}/{comparisonId}`

Same validated full body and duplicate/self rules; 200 message. Missing comparison or business rule failure 400.

### `DELETE /api/v1/property-comparison/delete/{userId}/{comparisonId}`

Deletes comparison belonging to user. 200 message; missing comparison 400.

## Global request/response notes

- No endpoint declares query parameters, pagination, sorting, custom headers, cookies, multipart inputs, or content negotiation.
- No `@ResponseStatus` changes success behavior beyond explicit `ResponseEntity` codes described above.
- Error behavior is globally mapped by `AdviceController`; see [API_ERRORS.md](API_ERRORS.md).
- Entity timestamps use Java `LocalDateTime` / `LocalDate`; Jackson's exact wire formatting is not overridden in source. Typical Boot/Jackson output is ISO-like, but no runtime serialization check was performed.
- Public read-all routes expose all users' homes/preferences/comparisons. This follows directly from their unfiltered repository `findAll()` calls.
