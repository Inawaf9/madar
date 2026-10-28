export function commuteRequestPath(latitude: number, longitude: number) {
  const query = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
  });
  return `/api/v1/place-preference/me/commutes?${query}`;
}

export function compareSavedPropertiesPath(savedPropertyIds: number[]) {
  return `/api/v1/property-comparison/me/compare-multiple/${savedPropertyIds.join(",")}`;
}
