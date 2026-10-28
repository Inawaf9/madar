import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

const source = readFileSync(
  fileURLToPath(
    new URL("../features/recommendations/smart-recommendations.tsx", import.meta.url),
  ),
  "utf8",
);

test("paid smart recommendations require current price/balance and explicit confirmation", () => {
  assert.match(source, /TOP_3_RECOMMENDATIONS/);
  assert.match(source, /balance\.data\.balance >= cost/);
  assert.match(source, /<AlertDialogAction/);
  assert.match(source, /request\.mutate\(weights \?\? undefined\)/);
  assert.match(source, /retry: 0/);
  assert.match(source, /requestInFlight\.current/);
});
