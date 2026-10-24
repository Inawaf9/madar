/** Saudi administrative regions; identity colors retain the existing MADAR mapping. */
export const administrativeRegions = [
  { id: "riyadh", ar: "منطقة الرياض", en: "Riyadh Region", identity: "najdi" },
  { id: "makkah", ar: "منطقة مكة المكرمة", en: "Makkah Region", identity: "coastal" },
  { id: "asir", ar: "منطقة عسير", en: "Asir Region", identity: "highlands" },
  { id: "eastern", ar: "المنطقة الشرقية", en: "Eastern Province", identity: "oasis" },
  { id: "madinah", ar: "منطقة المدينة المنورة", en: "Madinah Region", identity: "rose" },
  { id: "tabuk", ar: "منطقة تبوك", en: "Tabuk Region", identity: "northern" },
  // No arbitrary assignment of the six reference colors to the remaining regions.
  { id: "qassim", ar: "منطقة القصيم", en: "Qassim Region", identity: null },
  { id: "hail", ar: "منطقة حائل", en: "Hail Region", identity: null },
  { id: "northern-borders", ar: "منطقة الحدود الشمالية", en: "Northern Borders Region", identity: null },
  { id: "jazan", ar: "منطقة جازان", en: "Jazan Region", identity: null },
  { id: "najran", ar: "منطقة نجران", en: "Najran Region", identity: null },
  { id: "al-bahah", ar: "منطقة الباحة", en: "Al Bahah Region", identity: null },
  { id: "al-jawf", ar: "منطقة الجوف", en: "Al Jawf Region", identity: null },
] as const;


