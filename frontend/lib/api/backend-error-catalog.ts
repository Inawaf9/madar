/** Only reviewed, fixed backend messages may cross the BFF boundary. */
const safeMessages = new Set([
  "Email already registered",
  "Current password is incorrect",
  "New password must be different",
  "Invalid or expired reset code",
  "Housing preference not found",
  "Housing preferences not found",
  "Current home not found for this user",
  "No places found for this user",
  "No saved properties found for this user",
  "User not found",
  "User Not Found",
  "This property is already in your saved list",
  "This comparison already exists",
  "Cannot compare a property with itself",
  "User already has a current home",
  "User already has housing preferences",
  "Property price is unavailable",
  "No properties found for recommendation",
  "No properties have sufficient data for matching",
  "Property has insufficient data for matching",
  "Housing budget is invalid",
  "AI is unavailable right now",
  "Neighborhood suitability data is unavailable",
  "Cannot calculate commute score without valid place weights",
  "Kite rejected the city, filters, cursor, or page size allowed by the current plan",
  "Kite city or filter reference was not found",
  "Kite is unavailable right now",
  "Kite API key is invalid",
  "AI explanations were not returned",
  "AI comparison explanation was not returned",
  "Choose 2 to 4 different saved properties",
  "A KITE source and numeric property ID are required",
  "No important places found for this user",
  "Invalid property coordinates",
  "Google Places response is unavailable",
  "Invalid location coordinates",
  "Invalid search radius",
  "Unsupported Google place type",
  "Search query is required",
  "Google Places returned an empty response",
  "Failed to search places by text",
  "Failed to search nearby service types",
  "Maximum 50 place types are allowed",
  "No route found",
  "Google Routes returned incomplete distance or duration data",
  "Correct your important places before purchasing a commute report",
  "At least one important place must have weekly visits",
  "رصيدك من الكريدت غير كافٍ لاستخدام هذه الخدمة. اشحن رصيدك وحاول مرة ثانية.",
]);

export function safeBackendMessage(message: string): string | undefined {
  if (message.startsWith("Failed to search nearby places:"))
    return "Google Places search failed";
  if (message.startsWith("Failed to calculate route:"))
    return "Google Routes request failed";
  if (/^Saved property not found for this user: \d+$/.test(message))
    return "Saved property not found for this user";
  return safeMessages.has(message) ? message : undefined;
}

export function backendFailure(status: number, message: string) {
  return { status, backendMessage: safeBackendMessage(message) };
}
