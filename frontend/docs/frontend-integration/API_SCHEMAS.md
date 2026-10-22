# MADAR API schemas

The application accepts and returns JPA entities directly, rather than dedicated DTOs. The schemas below are verified against model fields, validation annotations, and Jackson annotations. Fields marked generated are normally server-managed but the entities still expose setters and body binding may accept them unless service code overwrites/ignores them. Nullable means Java/reference type can be null and no validation requires a value; optional means clients may omit it without Bean Validation rejecting the request. The two concepts overlap.

## Common response

```ts
export interface ApiResponse { message: string }
```

Verified JSON shape: one `message` string. Used for success messages and many handled errors.

## User

```ts
export interface UserResponse {
  id: number | null;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'USER';
  createdAt: string | null; // LocalDateTime; exact serialization not configured
}
export interface RegisterUserRequest {
  fullName: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'USER'; // validation requires it; registration service overwrites it to USER
}
export type UpdateUserRequest = RegisterUserRequest;
```

| Field | Java / JSON type | Required on validated input | Constraints / behavior |
|---|---|---:|---|
| `id` | Integer / number | No | Generated; registration nulls it. |
| `fullName` | String | Yes | `@NotEmpty`, size 3–100. |
| `email` | String | Yes | `@NotEmpty`, `@Email`; unique database/business check. |
| `password` | String | Yes | `@NotEmpty`, 8–64, uppercase + lowercase + digit + non-whitespace special char, no whitespace; write-only serialization. Registration stores plaintext as coded; do not send real credentials in docs/examples. |
| `role` | String | Yes | `ADMIN` or `USER`, validated. Registration overrides to `USER`; update services ignore it. |
| `createdAt` | LocalDateTime / string | No | Set on insert; read response. |
| relationships | entities/collections | N/A | `@JsonIgnore`; not serialized or bound through getters as normal JSON response. |

Example response (illustrative):
```json
{"id":12,"fullName":"Rana Sample","email":"rana@example.test","role":"USER","createdAt":"2026-10-20T09:30:00"}
```

## CurrentHome

```ts
export interface CurrentHome {
  id?: number | null;
  latitude: number;
  longitude: number;
  externalPropertyId?: string | null;
  source?: string | null;
  movedInAt?: string | null; // LocalDate
  confirmedByUserAt?: string | null; // LocalDateTime, assigned on insert
}
```

| Field | Required input | Constraints / behavior |
|---|---:|---|
| `id` | No | Integer, generated. |
| `latitude` | Yes | Double, `@NotNull`; no coordinate range constraint. |
| `longitude` | Yes | Double, `@NotNull`; no coordinate range constraint. |
| `externalPropertyId` | No | String, nullable, column length 150. |
| `source` | No | String, nullable, column length 50. |
| `movedInAt` | No | `LocalDate`; expected date string `YYYY-MM-DD` under standard Jackson Java time support. |
| `confirmedByUserAt` | No | `LocalDateTime`, generated in `@PrePersist`. |
| `user` | No | Owning relationship ignored in JSON. |

## HousingPreference

```ts
export interface HousingPreference {
  id?: number | null;
  region: string;
  city: string;
  district?: string | null;
  maxBudget: number;
  propertyType: string;
  listingType: 'rent' | 'sale';
  user?: UserResponse | null; // relation is not ignored on this model; check serialization caution below
}
```

`user` is a non-ignored `@OneToOne` field. Serializing it can include user data (minus the user's ignored back-reference fields and write-only password). This creates an exposure/shape concern; no DTO shields it.

| Field | Required input | Constraints / behavior |
|---|---:|---|
| `id` | No | Generated Integer. |
| `region`, `city` | Yes | `@NotEmpty`, String. |
| `district` | No | Nullable String. |
| `maxBudget` | Yes | BigDecimal/JSON number, `@NotNull`, `@DecimalMin("1.0")`. |
| `propertyType` | Yes | `@NotEmpty` String; no enum restriction. |
| `listingType` | Yes | `@NotEmpty`, regex exactly `rent` or `sale`. |
| `user` | No | Service assigns from path user ID; entity relationship is not JSON-ignored. Avoid sending it. |

## PlacePreference

```ts
export interface PlacePreference {
  id?: number | null;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  importance: number;
  visitPerWeek: number;
}
```

| Field | Required input | Constraints / behavior |
|---|---:|---|
| `id` | No | Generated; add service nulls it. |
| `name` | Yes | `@NotEmpty`, max storage length 100. |
| `type` | Yes | `@NotEmpty`, max storage length 50; no enum list. |
| `latitude` | Yes | Double, `@NotNull`, -90 to 90. |
| `longitude` | Yes | Double, `@NotNull`, -180 to 180. |
| `importance` | Yes | Integer, `@NotNull`, 1–5. |
| `visitPerWeek` | Yes | Integer, `@NotNull`; no min/max constraint. |
| `user` | No | `@JsonIgnore`; assigned from path. |

## SavedProperty

```ts
export interface SavedProperty {
  id?: number | null;
  externalPropertyId: string;
  source: string;
  titleSnapshot?: string | null;
  savedAt?: string | null; // LocalDateTime, generated on save
}
```

`externalPropertyId` required/non-empty, storage max 150. `source` required/non-empty, storage max 50. `titleSnapshot` nullable, max 200. Database uniqueness is `(user_id, source, external_property_id)`. `user` is ignored in JSON. Add service resets `id` and sets `user`.

## PropertyComparison

```ts
export interface PropertyComparison {
  id?: number | null;
  firstPropertyId: string;
  secondPropertyId: string;
  firstPropertySource: string;
  secondPropertySource: string;
  createdAt?: string | null; // LocalDateTime, generated on insert
}
```

All four property ID/source strings have `@NotEmpty` and storage lengths 150/50. Service rejects self-comparisons and duplicate pairs irrespective of order. `user` is ignored in JSON and assigned on create.

## Payment model (no endpoint)

`Payment` is a persisted entity but has no controller or service and is not part of any current API contract. Fields: integer `id`; required `serviceType` string; required positive integer `amount`; `status` string matching `PENDING|PAID|FAILED|REFUNDED`; nullable `providerPaymentId`; generated `createdAt`; nullable `paidAt`; ignored user relationship. Do not infer a payment API from this entity or `MoyasarClient`.

## Date/time and serialization

Temporal fields are Java `LocalDate` and `LocalDateTime`. No custom serializers or formats were found. Jackson's Java-time module typically emits ISO values, but runtime wire output was not verified. Generated entity reads differ by type: `User`, `SavedProperty`, `CurrentHome`, `PropertyComparison`, and `PlacePreference` ignore owner back-reference; `HousingPreference.user` is exposed and may nest a user object. Do not rely on inferred examples where a provider controls response shape—there are currently no provider-backed API endpoints.

## Error shape note

Most handled errors return `{ "message": "..." }`, but three handlers return a plain string body (`NoResourceFoundException`, unsupported media type, missing path variable). See [API_ERRORS.md](API_ERRORS.md).
