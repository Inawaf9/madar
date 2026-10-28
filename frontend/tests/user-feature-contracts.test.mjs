import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { operationContracts } from "../lib/api/operation-contracts.ts";

const frontend = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, frontend), "utf8");

test("moving checklist operations are private, CSRF-protected BFF operations", () => {
  const expected = [
    ["POST", "/api/v1/moving-checklist/generate"],
    ["GET", "/api/v1/moving-checklist/get"],
    ["PUT", "/api/v1/moving-checklist/toggle/{taskId}"],
    ["DELETE", "/api/v1/moving-checklist/reset"],
  ];
  for (const [method, path] of expected) {
    const operation = operationContracts.find(
      (item) => item.method === method && item.path === path,
    );
    assert.equal(operation?.access, "private", `${method} ${path}`);
  }
  assert.match(
    read("app/api/backend/[...path]/route.ts"),
    /if \(request\.method !== "GET"\) await checkCsrf\(request\)/,
  );
});

test("credit-consuming GET comparisons require CSRF in browser client and BFF", () => {
  const client = read("lib/api/client.ts");
  const bff = read("app/api/backend/[...path]/route.ts");
  assert.ok(client.includes("property-comparison\\/me\\/compare-(?:two|multiple)"));
  assert.ok(bff.includes("property-comparison\\/me\\/compare-(?:two|multiple)"));
});
