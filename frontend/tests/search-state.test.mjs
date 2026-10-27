import assert from "node:assert/strict";
import test from "node:test";
import { initialSearchMode, smartSearchReady } from "../features/search/smart-search-state.ts";

test("discovery opens cards for a clean URL and preserves search links", () => {
  assert.equal(initialSearchMode(null, false), null);
  assert.equal(initialSearchMode(null, true), "normal");
  assert.equal(initialSearchMode("normal", false), "normal");
  assert.equal(initialSearchMode("smart", false), "smart");
});

test("smart readiness follows the server and never requires optional places or interests", () => {
  const savedHousing = { id: 8 };
  assert.equal(smartSearchReady({ readyForSearch: true }, savedHousing), true);
  assert.equal(smartSearchReady({ readyForSearch: false }, savedHousing), false);
  assert.equal(smartSearchReady({ readyForSearch: true }, null), false);
  assert.equal(smartSearchReady(undefined, savedHousing), false);
});
