import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const frontend = new URL("../", import.meta.url);
const backend = new URL(
  "../../Backend/src/main/java/com/example/madar/",
  import.meta.url,
);
const source = (path, root = frontend) => readFileSync(new URL(path, root), "utf8");

test("Spring refresh contract is a single-use POST with a token pair response", () => {
  const controller = source("Controller/AuthController.java", backend);
  const request = source("DTO/In/Auth/RefreshTokenRequest.java", backend);
  const response = source("DTO/Out/Auth/AuthResponse.java", backend);
  const contracts = source("lib/auth/contracts.ts");

  assert.match(controller, /@PostMapping\("\/refresh"\)/);
  assert.match(
    controller,
    /ResponseEntity<AuthResponse> refresh\(@Valid @RequestBody RefreshTokenRequest request\)/,
  );
  assert.match(request, /String refreshToken/);
  for (const field of [
    "accessToken",
    "tokenType",
    "userId",
    "email",
    "role",
    "refreshToken",
  ])
    assert.match(response, new RegExp(`String ${field}|Integer ${field}`));
  assert.match(contracts, /tokenType: z\.literal\("Bearer"\)/);
});

test("consumed refresh-token replay revokes its family, so the frontend fails closed", () => {
  const refreshService = source("Service/RefreshTokenService.java", backend);
  const policy = source("lib/auth/refresh-policy.server.ts");
  const route = source("app/api/auth/[operation]/route.ts");

  assert.match(
    refreshService,
    /if \(token\.getConsumedAt\(\) != null\)[\s\S]*?revokeFamily/,
  );
  assert.match(
    policy,
    /throw new ApiError\([\s\S]*?"Refresh coordination unavailable",\s*503/,
  );
  assert.match(
    route,
    /operation === "refresh"[\s\S]*?requireSafeRefreshCoordination\(\)/,
  );
  assert.match(route, /await checkCsrf\(request\)/);
});

test("refresh token is not sent to Spring until safe coordination is available", () => {
  const api = source("lib/auth/auth-api.server.ts");
  const session = source("lib/auth/session.server.ts");
  const packageJson = source("package.json");

  const refreshImplementation = api.slice(
    api.indexOf("refresh: async"),
    api.indexOf("logout:"),
  );
  assert.match(refreshImplementation, /requireSafeRefreshCoordination\(\)/);
  assert.ok(
    refreshImplementation.indexOf("requireSafeRefreshCoordination()") <
      refreshImplementation.indexOf('publicBackend("/api/v1/auth/refresh"'),
  );
  assert.match(session, /httpOnly: true/);
  assert.doesNotMatch(packageJson, /"(?:ioredis|@upstash\/redis|redis)"\s*:/);
});
