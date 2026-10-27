import assert from "node:assert/strict";
import test from "node:test";
import { normalizeRecoveryCode } from "../features/auth/recovery-code.ts";

test("recovery code accepts Arabic, Persian, and ASCII digits", () => {
  assert.equal(normalizeRecoveryCode("١٢٣456"), "123456");
  assert.equal(normalizeRecoveryCode("۱۲۳۴۵۶"), "123456");
});

test("recovery code removes non-digits and limits input to six digits", () => {
  assert.equal(normalizeRecoveryCode(" 1a2-3 4 5 6 7 "), "123456");
});
