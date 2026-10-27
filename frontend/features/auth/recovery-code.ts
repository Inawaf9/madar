/** Accept digits entered with Arabic or Persian keyboards without changing the six-digit API format. */
export function normalizeRecoveryCode(value: string): string {
  return value
    .replace(/[٠-٩۰-۹]/g, (digit) =>
      String(digit.charCodeAt(0) - (digit.charCodeAt(0) <= 0x0669 ? 0x0660 : 0x06f0)),
    )
    .replace(/\D/g, "")
    .slice(0, 6);
}
