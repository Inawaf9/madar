export function encodeBackendPathSegments(segments: string[]) {
  return `/${segments.map(encodeURIComponent).join("/")}`;
}
