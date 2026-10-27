// Supported codes mirror LifestyleInterestService.configureInterest in the current backend.
export const lifestyleInterestGroups: {
  title: { ar: string; en: string };
  options: [string, string, string][];
}[] = [
  {
    title: { ar: "اهتمامات عامة", en: "General interests" },
    options: [
      ["education", "التعليم", "Education"],
      ["health", "الصحة", "Health"],
      ["sports", "الرياضة", "Sports"],
      ["shopping", "التسوق", "Shopping"],
      ["nature", "الطبيعة", "Nature"],
      ["food", "المطاعم والمقاهي", "Food and cafés"],
      ["transport", "النقل العام", "Public transport"],
      ["services", "الخدمات اليومية", "Daily services"],
    ],
  },
  {
    title: { ar: "التعليم", en: "Education" },
    options: [
      ["kindergarten", "رياض الأطفال", "Kindergarten"],
      ["primary_school", "مدرسة ابتدائية", "Primary school"],
      ["intermediate_school", "مدرسة متوسطة", "Intermediate school"],
      ["high_school", "مدرسة ثانوية", "High school"],
      ["university", "جامعة", "University"],
    ],
  },
  {
    title: { ar: "الصحة", en: "Health" },
    options: [
      ["hospital", "مستشفى", "Hospital"],
      ["medical_center", "مركز طبي", "Medical center"],
      ["medical_clinic", "عيادة طبية", "Medical clinic"],
      ["dentist", "طبيب أسنان", "Dentist"],
      ["pharmacy", "صيدلية", "Pharmacy"],
      ["physiotherapy", "علاج طبيعي", "Physiotherapy"],
    ],
  },
  {
    title: { ar: "الرياضة", en: "Sports" },
    options: [
      ["fitness", "نادي رياضي", "Gym"],
      ["swimming_pool", "مسبح", "Swimming pool"],
      ["yoga", "يوغا", "Yoga"],
      ["sports_field", "ملعب رياضي", "Sports field"],
      ["sports_complex", "مجمع رياضي", "Sports complex"],
    ],
  },
  {
    title: { ar: "التسوق", en: "Shopping" },
    options: [
      ["supermarket", "سوبرماركت", "Supermarket"],
      ["hypermarket", "هايبر ماركت", "Hypermarket"],
      ["shopping_mall", "مركز تسوق", "Shopping mall"],
      ["furniture", "متجر أثاث", "Furniture store"],
      ["home_goods", "مستلزمات منزلية", "Home goods"],
    ],
  },
  {
    title: { ar: "الطبيعة", en: "Nature" },
    options: [
      ["park", "حديقة", "Park"],
      ["walking_track", "ممشى", "Walking track"],
      ["playground", "ملعب أطفال", "Playground"],
    ],
  },
  {
    title: { ar: "المطاعم والمقاهي", en: "Food and cafés" },
    options: [
      ["restaurant", "مطعم", "Restaurant"],
      ["cafe", "مقهى", "Café"],
      ["bakery", "مخبز", "Bakery"],
    ],
  },
  {
    title: { ar: "النقل العام", en: "Transport" },
    options: [
      ["metro", "مترو", "Metro"],
      ["bus_station", "محطة حافلات", "Bus station"],
    ],
  },
  {
    title: { ar: "الخدمات اليومية", en: "Daily services" },
    options: [
      ["bank", "بنك", "Bank"],
      ["atm", "صراف آلي", "ATM"],
      ["laundry", "مغسلة", "Laundry"],
      ["gas_station", "محطة وقود", "Gas station"],
    ],
  },
];

export function lifestyleInterestLabel(code: string, locale: string) {
  const option = lifestyleInterestGroups
    .flatMap((group) => group.options)
    .find(([value]) => value === code);
  return option ? option[locale === "ar" ? 1 : 2] : code;
}
