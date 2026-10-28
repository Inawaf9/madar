import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const backendControllers = fileURLToPath(
  new URL("../../Backend/src/main/java/com/example/madar/Controller/", import.meta.url),
);
const frontendRoot = new URL("../", import.meta.url);
const operationContracts = readFileSync(
  new URL("lib/api/operation-contracts.ts", frontendRoot),
  "utf8",
);
const authRoute = readFileSync(
  new URL("app/api/auth/[operation]/route.ts", frontendRoot),
  "utf8",
);

function backendEndpoints() {
  const endpoints = [];
  for (const file of readdirSync(backendControllers).filter((name) =>
    name.endsWith("Controller.java"),
  )) {
    const source = readFileSync(join(backendControllers, file), "utf8");
    const base = source.match(/@RequestMapping\("([^"]+)"\)/)?.[1];
    assert.ok(base, `${file} needs a class-level @RequestMapping`);
    const mapping = /@(Get|Post|Put|Patch|Delete)Mapping(?:\("([^"]*)"\))?\s*public\s+/g;
    for (const match of source.matchAll(mapping)) {
      const method = {
        Get: "GET",
        Post: "POST",
        Put: "PUT",
        Patch: "PATCH",
        Delete: "DELETE",
      }[match[1]];
      endpoints.push(`${method} ${base}${match[2] ?? ""}`);
    }
  }
  return endpoints;
}

function exposedEndpoints() {
  const contracts = [];
  const block = /\{\s*method:\s*"(GET|POST|PUT|PATCH|DELETE)"\s*,\s*path:\s*"([^"]+)"/g;
  for (const match of operationContracts.matchAll(block))
    contracts.push(`${match[1]} ${match[2]}`);
  for (const match of authRoute.matchAll(/operation === "([a-z-]+)"/g)) {
    // Auth operations are routed by the dedicated BFF and intentionally bypass the business proxy.
    contracts.push(`AUTH /api/v1/auth/${match[1]}`);
  }
  for (const match of authRoute.matchAll(/\["([a-z-]+)"\s*,\s*"([a-z-]+)"\]/g))
    for (const operation of match.slice(1))
      contracts.push(`AUTH /api/v1/auth/${operation}`);
  return contracts;
}

test("all Spring mappings are inventoried in the endpoint audit", () => {
  const report = readFileSync(
    new URL("docs/unused-endpoints-audit.md", frontendRoot),
    "utf8",
  );
  const inventory = report
    .split("## قائمة Controllers الكاملة")[1]
    ?.split("## Endpoints غير المستخدمة")[0];
  assert.ok(inventory, "Endpoint inventory section is present");
  const count = backendEndpoints().length;
  assert.match(report, new RegExp(`إجمالي Backend Endpoints\\s*\\|\\s*${count}\\s*\\|`));
  assert.equal(
    (inventory.match(/^\| (?:GET|POST|PUT|PATCH|DELETE)\s+\|/gm) ?? []).length,
    count,
  );
});

test("verification matrix has one status row per mapping and no runtime-only claims", () => {
  const matrix = readFileSync(
    new URL("docs/api-endpoint-verification.md", frontendRoot),
    "utf8",
  );
  const rows = matrix.match(/^\| (?:GET|POST|PUT|PATCH|DELETE)\s+\|/gm) ?? [];
  assert.equal(rows.length, backendEndpoints().length);
  assert.doesNotMatch(matrix, /\*\*VERIFIED\*\*/);
  assert.match(matrix, /\*\*BLOCKED\*\*/);
});

test("new browser API gaps are either exposed or explicitly tracked", () => {
  const contracts = exposedEndpoints();
  const normalized = new Set(contracts.map((entry) => entry.replace(/\{[^}]+\}/g, "{}")));
  const missing = backendEndpoints().filter((entry) => {
    const [method, path] = entry.split(" ");
    const key = `${method} ${path.replace(/\{[^}]+\}/g, "{}")}`;
    if (normalized.has(key)) return false;
    if (path.startsWith("/api/v1/auth/") && contracts.includes(`AUTH ${path}`))
      return false;
    // Inbound integrations are intentionally not browser operations.
    if (path.startsWith("/api/v1/n8n/")) return false;
    return true;
  });
  const knownGaps = [
    "GET /api/v1/user/admin/dashboard",
    "GET /api/v1/user/admin/users/search",
    "GET /api/v1/user/admin/users/{userId}",
    "GET /api/v1/user/admin/dashboard/recent-users",
    "GET /api/v1/user/admin/payments",
    "GET /api/v1/user/admin/payments/{paymentId}",
    "POST /api/v1/user/admin/users/{targetUserId}/gift-credits",
    "GET /api/v1/user/admin/audit-logs",
    "GET /api/v1/user/admin/system-health",
    "GET /api/v1/credit-packages",
    "POST /api/v1/credit-packages",
    "PUT /api/v1/credit-packages/{packageId}",
    "DELETE /api/v1/credit-packages/{packageId}",
    "POST /api/v1/payments/webhook",
  ];
  assert.deepEqual(missing, knownGaps, `Review changed API gaps: ${missing.join(", ")}`);
});
