function withQuery(path: string, values: Record<string, string | number>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) query.set(key, String(value));
  return `${path}?${query.toString()}`;
}

export const neighborhoodRequestPaths = {
  category: (category: string, radius: number) =>
    withQuery("/api/v1/current-home/me/nearby-by-category", { category, radius }),
  essentials: (radius: number) =>
    withQuery("/api/v1/current-home/me/nearest-essential", { radius }),
  search: (query: string, radius: number) =>
    withQuery("/api/v1/current-home/me/nearby-search", { query, radius }),
};
