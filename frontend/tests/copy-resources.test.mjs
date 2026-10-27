import assert from "node:assert/strict";
import test from "node:test";
import { layoutCopy } from "../messages/layout-copy.ts";
import { getProductCopy } from "../messages/product-copy.ts";

function placeholders(value) {
  return [...value.matchAll(/\{\s*([A-Za-z_]\w*)/g)].map((match) => match[1]).sort();
}

test("shared TypeScript copy resources keep Arabic and English keys aligned", () => {
  for (const copy of [
    layoutCopy,
    { ar: getProductCopy("ar"), en: getProductCopy("en") },
  ]) {
    assert.deepEqual(Object.keys(copy.ar).sort(), Object.keys(copy.en).sort());
    for (const key of Object.keys(copy.ar)) {
      assert.deepEqual(placeholders(copy.ar[key]), placeholders(copy.en[key]), key);
    }
  }
});
