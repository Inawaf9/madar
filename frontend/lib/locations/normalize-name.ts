/** Search text only: no city identifiers, geographic classification or provider mapping. */
export function normalizeLocationName(value: unknown) {
  if (typeof value !== "string") return "";
  return value
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ");
}
