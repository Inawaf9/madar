export function serializeQuery(input: object): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input))
    if (value !== undefined && value !== null && value !== "")
      params.set(key, String(value));
  return params.toString();
}
