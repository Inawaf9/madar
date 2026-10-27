import { z } from "zod";
import { categories } from "@/lib/api/discovery-contracts";

export type PoiCategory = (typeof categories)[number];
export const poiCategorySchema = z.enum(categories);
export const POI_RADIUS_METERS = 2000;
export const POI_LIMIT = 20;
export const geoapifyCategories: Record<PoiCategory, string> = {
  supermarket: "commercial.supermarket",
  hospital: "healthcare.hospital",
  pharmacy: "healthcare.pharmacy",
  park: "leisure.park",
  gym: "sport.fitness",
  cafe: "catering.cafe",
  restaurant: "catering.restaurant",
  school: "education.school",
  shopping_mall: "commercial.shopping_mall",
};
export const mapPoiSchema = z.object({
  id: z.string().min(1),
  name: z.string().nullable(),
  address: z.string().nullable(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  category: poiCategorySchema,
  provider: z.literal("geoapify"),
});
export const mapPoiResponseSchema = z.object({
  provider: z.literal("geoapify"),
  places: z.array(mapPoiSchema).max(POI_LIMIT),
});
export type MapPoi = z.infer<typeof mapPoiSchema>;

// Shared SVG paths for React list icons and native MapLibre marker buttons.
export const poiIconPaths: Record<PoiCategory, string[]> = {
  supermarket: ["m3 3 2 2 3 12h10l3-10H5", "M9 21h.01M18 21h.01"],
  hospital: ["M4 21V3h16v18H4Z", "M9 8h6m-3-3v6", "M9 21v-5h6v5"],
  pharmacy: ["M4 4h16v16H4Z", "M8 12h8m-4-4v8"],
  park: ["m12 3 6 7h-3l5 6H4l5-6H6l6-7Z", "M12 16v5"],
  gym: ["m6 6 12 12", "m3 7 4-4m10 18 4-4M3 3l4 4m10 10 4 4"],
  cafe: [
    "M4 8h12v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8Z",
    "M16 8h2a3 3 0 0 1 0 6h-2M6 3v2m4-2v2m4-2v2",
  ],
  restaurant: [
    "M5 3v7m4-7v7M3 3v5a4 4 0 0 0 8 0V3M7 12v9",
    "M20 3c-4 2-4 10 0 10V3Zm0 10v8",
  ],
  school: ["m3 9 9-6 9 6v12H3V9Z", "M9 21v-7h6v7M12 8v3m-2-1h4"],
  shopping_mall: ["M4 7h16l1 14H3L4 7Z", "M8 7V5a4 4 0 0 1 8 0v2"],
};
