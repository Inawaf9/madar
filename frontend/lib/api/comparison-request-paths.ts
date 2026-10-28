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

export function compareTwoPropertiesPath(
  firstSource: string,
  firstPropertyId: string,
  secondSource: string,
  secondPropertyId: string,
) {
  const encode = (value: string) => encodeURIComponent(value);
  return `/api/v1/property-comparison/me/compare-two/${encode(firstSource)}/${encode(firstPropertyId)}/${encode(secondSource)}/${encode(secondPropertyId)}`;
}
