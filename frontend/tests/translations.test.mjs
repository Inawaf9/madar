import assert from "node:assert/strict";
import test from "node:test";
import { checkTranslationSources } from "../scripts/check-translations.mjs";

test("Arabic and English translation sources have matching keys and placeholders", () => {
  const { issues, keyCount } = checkTranslationSources();
  assert.deepEqual(issues, []);
  assert.ok(keyCount > 0);
});
