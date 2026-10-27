import { categoryLabel } from "@/lib/maps/place-presentation";
import { categories } from "@/lib/api/discovery-contracts";
const labels: Record<string, [string, string]> = {
  affordability: ["ملاءمة الميزانية", "Affordability"],
  match: ["مطابقة العقار", "Property match"],
  neighborhood: ["ملاءمة الحي", "Neighborhood suitability"],
  rent: ["إيجار", "Rent"],
  sale: ["شراء", "Buy"],
  all: ["جميع الأنواع", "All types"],
  apartment: ["شقة", "Apartment"],
  villa: ["فيلا", "Villa"],
  floor: ["دور", "Floor"],
  duplex: ["دوبلكس", "Duplex"],
  building: ["عمارة", "Building"],
  land: ["أرض", "Land"],
  office: ["مكتب", "Office"],
  shop: ["محل", "Shop"],
  warehouse: ["مستودع", "Warehouse"],
  true: ["مفروش", "Furnished"],
  false: ["غير مفروش", "Unfurnished"],
  monthly: ["إعلان شهري، الميزانية سنوية", "Monthly listing, annual budget"],
  yearly: ["سنوي", "Yearly"],
  driving: ["قيادة فقط", "Driving only"],
  work: ["العمل", "Work"],
  university: ["جامعة", "University"],
  school: ["مدرسة", "School"],
  hospital: ["مستشفى", "Hospital"],
  family: ["العائلة", "Family"],
  other: ["أخرى", "Other"],
  "/dashboard": ["لوحة التحكم", "Dashboard"],
  "/properties": ["البحث", "Property search"],
  "/saved": ["المحفوظات", "Saved properties"],
  "/profile": ["الحساب والتفضيلات", "Profile and preferences"],
  "/locations": ["الأماكن", "Places"],
  "/interests": ["الاهتمامات", "Interests"],
  "/compare": ["المقارنات", "Comparisons"],
  "/neighborhood": ["الحي والتحليل", "Neighborhood analysis"],
  "/payments": ["المدفوعات والتحقق", "Payments and verification"],
  "/login": ["تسجيل الدخول", "Sign in"],
  "/register": ["إنشاء حساب", "Register"],
};
export function actionLabel(value: string, ar: boolean) {
  return (
    labels[value]?.[ar ? 0 : 1] ||
    (ar && (categories as readonly string[]).includes(value)
      ? categoryLabel(value)
      : value.replaceAll("_", " "))
  );
}
