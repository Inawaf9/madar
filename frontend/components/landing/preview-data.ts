import { regions } from "./regions";

export type PreviewProperty = {
  id: string;
  title: string | null;
  city: string | null;
  neighborhood?: string | null;
  purpose: "rent" | "sale";
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqm: number | null;
  image?: string | null;
  regionId?: string;
};

// Deliberately synthetic visual fixtures. Never merge these into real inventory.
export function createPreviewProperties(city: string, purpose: "rent" | "sale", arabic: boolean): PreviewProperty[] {
  const region = regions.find((item) => item.id === city);
  if (!region) return [];
  const location = arabic ? region.ar : region.en;
  return [
    { id: `preview-${city}-${purpose}-1`, title: arabic ? "شقة عصرية بإضاءة طبيعية" : "A contemporary apartment filled with natural light", city: location, purpose, price: purpose === "rent" ? 48000 : 890000, bedrooms: 3, bathrooms: 2, areaSqm: 165, regionId: city },
    { id: `preview-${city}-${purpose}-2`, title: arabic ? "مساحة عائلية بتفاصيل هادئة وحياة يومية أقرب لما يهمك" : "A thoughtful family home with room for the everyday moments that matter", city: location, purpose, price: purpose === "rent" ? 72000 : 1250000, bedrooms: 4, bathrooms: null, areaSqm: 280, regionId: city },
    { id: `preview-${city}-${purpose}-3`, title: arabic ? "خيار سكني — معاينة بيانات غير مكتملة" : "A home option — incomplete data preview", city: null, purpose, price: null, bedrooms: null, bathrooms: null, areaSqm: null },
  ];
}
