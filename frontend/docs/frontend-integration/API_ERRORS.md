# MADAR API errors

## Actual global behavior

`AdviceController` maps a variety of exceptions. Most handlers return `ApiResponse`, serialized as `{"message":"..."}`. There is no normalized timestamp, error code, field-error map, or trace ID. Several exception messages come from framework/database exceptions and therefore are not stable for frontend display.

| Trigger / exception | Status returned | Body |
|---|---:|---|
| `ApiException` business errors | 400 | `{"message":"<exception message>"}` |
| `MethodArgumentNotValidException` (`@Valid` body) | 400 | `{"message":"<first field error default message>"}`; only first field error selected, not field name/list |
| `ConstraintViolationException` | 400 | `{"message":"<exception message>"}` |
| `SQLIntegrityConstraintViolationException` | 400 | message object |
| `InvalidDataAccessResourceUsageException` | 400 | message object |
| `DataIntegrityViolationException` | 400 | message object |
| Unsupported HTTP method | 400 | message object (Spring normally uses 405, overridden here) |
| Unreadable/malformed JSON | 400 | message object |
| Path argument type mismatch | 400 | message object |
| `ResponseStatusException` | Its embedded status | message object using reason; no known controller use found |
| Other `RuntimeException` | 400 | message object; may expose raw exception message |
| `NoResourceFoundException` (unmapped path) | 400 | plain string message |
| Unsupported media type | 400 | plain string message (Spring normally uses 415) |
| Missing path variable | 400 | plain string message |

Uncaught exception categories outside these handlers may use Spring Boot's default error response. That behavior was not runtime-verified. Spring Security 401/403 behavior does not apply in the inspected project because no security dependency/configuration was found.

## Common business failures

| Feature | Conditions (examples from services) |
|---|---|
| User | User not found; duplicate email; admin ID missing; caller ID role not ADMIN; admin cannot delete itself. |
| Current home | User/home missing; user already has a current home; home does not belong to user. |
| Housing preference | User/preference missing; already has preference; preference does not belong to user. |
| Place preference | User missing; no places found; place missing; owner mismatch; importance outside 1–5. |
| Saved property | User missing; no saved properties; duplicate saved tuple; saved item missing/owner mismatch. |
| Comparison | User/comparison missing; same property compared with itself; duplicate pair in either order. |

All these use HTTP 400 through `ApiException` handler, including resource absence and authorization-like ownership failures. No 404/403 distinction is implemented.

## Validation examples

Illustrative response for an invalid `importance` or other model constraint:

```json
{"message":"Importance must be at least 1"}
```

Exact selected validation message depends on Spring's `FieldError` ordering if several fields fail. The response does not identify the field. For malformed JSON, the framework message may vary with parser/runtime versions.

## Frontend handling guidance

- Treat 400 as business, validation, not-found, conflict, ownership, and bad-request outcomes; inspect `Content-Type` and tolerate either a JSON message object or plain text string.
- Do not depend on exact framework/database error strings. Show a generic fallback when parsing fails or `message` is absent.
- A 200/201 response may be `ApiResponse`, an entity, an array, or—in GET list cases—an error object when there are no results.
- Avoid displaying raw exception text from database/framework errors directly to users.
- Authentication failures are not currently part of the API's implemented error contract.
