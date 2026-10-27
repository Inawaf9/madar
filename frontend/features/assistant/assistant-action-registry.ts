import { z } from "zod";
import { searchSchema, propertyTypes, categories } from "@/lib/api/discovery-contracts";
import { weightsSchema } from "@/lib/api/insight-contracts";
import {
  placeSchema,
  currentHomeSchema,
  housingPreferenceSchema,
  savedPropertySchema,
} from "@/lib/api/contracts";

export const toolNames = [
  "search",
  "budget",
  "specifications",
  "interests",
  "place",
  "destinations",
  "saved-properties",
  "comparison",
  "services",
  "commute",
  "housing",
  "home",
  "navigation",
  "save-property",
  "remove-place",
  "reset-search",
  "comparison-select",
  "weights",
  "analysis",
  "home-remove",
  "housing-remove",
  "confirm-move",
  "location",
  "property-reference",
] as const;
export type ToolName = (typeof toolNames)[number];
export type InteractionStatus =
  "idle" | "awaiting_input" | "submitting" | "completed" | "failed" | "cancelled";
export type ToolInput = Record<string, unknown>;
export type FieldKind =
  | "text"
  | "number"
  | "select"
  | "multi"
  | "city"
  | "neighborhood"
  | "district"
  | "region"
  | "map"
  | "date"
  | "places"
  | "properties";
export type ToolField = {
  name: string;
  kind: FieldKind;
  label: [string, string];
  options?: readonly string[];
  optional?: boolean;
  min?: number;
  max?: number;
  step?: number | "any";
  custom?: boolean;
};
type ToolDefinition = {
  title: [string, string];
  schema: z.ZodType;
  fields: ToolField[];
  confirmation: boolean;
  defaults: ToolInput;
};
const field = (
  name: string,
  kind: FieldKind,
  ar: string,
  en: string,
  more: Partial<ToolField> = {},
): ToolField => ({ name, kind, label: [ar, en], ...more });
const locationFields = [field("latitude", "map", "الموقع", "Location")];
const priceFields = [
  field("minPrice", "number", "أقل سعر (ر.س)", "Minimum price (SAR)", {
    optional: true,
    min: 0,
    max: 2000000000,
  }),
  field("maxPrice", "number", "أعلى سعر (ر.س)", "Maximum price (SAR)", {
    optional: true,
    min: 0,
    max: 2000000000,
  }),
];
const specs = [
  field("minBedrooms", "number", "أقل غرف نوم", "Minimum bedrooms", {
    optional: true,
    min: 0,
    max: 20,
  }),
  field("minBathrooms", "number", "أقل حمامات", "Minimum bathrooms", {
    optional: true,
    min: 0,
    max: 20,
  }),
  field("minArea", "number", "أقل مساحة (م²)", "Minimum area (m²)", {
    optional: true,
    min: 0,
    max: 10000000,
    step: "any",
  }),
  field("maxArea", "number", "أعلى مساحة (م²)", "Maximum area (m²)", {
    optional: true,
    min: 0,
    max: 10000000,
    step: "any",
  }),
  field("furnished", "select", "التأثيث", "Furnishing", {
    optional: true,
    options: ["true", "false"],
  }),
  field("rentFrequency", "select", "دورية الإعلان", "Listing frequency", {
    optional: true,
    options: ["monthly", "yearly"],
  }),
];
const selected = z
  .object({
    ids: z
      .array(z.string().min(1).max(200))
      .min(1)
      .max(20)
      .refine((ids) => new Set(ids).size === ids.length),
  })
  .strict();
const ranges = (schema: z.ZodObject) =>
  schema.superRefine((value, ctx) => {
    for (const [a, b] of [
      ["minPrice", "maxPrice"],
      ["minArea", "maxArea"],
    ])
      if (
        typeof value[a] === "number" &&
        typeof value[b] === "number" &&
        value[a] > value[b]
      )
        ctx.addIssue({ code: "custom", path: [b], message: "Invalid range" });
  });
export const assistantActionRegistry: Record<ToolName, ToolDefinition> = {
  search: {
    title: ["البحث عن عقار", "Find a property"],
    schema: searchSchema,
    fields: [
      field("city", "city", "المدينة", "City"),
      field("purpose", "select", "نوع العرض", "Listing type", {
        options: ["rent", "sale"],
      }),
      field(
        "neighborhoodId",
        "neighborhood",
        "الحي (اختياري)",
        "Neighborhood (optional)",
        { optional: true },
      ),
      field("type", "select", "نوع العقار", "Property type", { options: propertyTypes }),
      ...priceFields,
      field("q", "text", "كلمة بحث", "Keyword", { optional: true }),
    ],
    confirmation: false,
    defaults: { city: "", purpose: "rent", type: "all", sort: "newest" },
  },
  budget: {
    title: ["تعديل الميزانية", "Adjust budget"],
    schema: ranges(
      z.object({
        minPrice: searchSchema.shape.minPrice,
        maxPrice: searchSchema.shape.maxPrice,
      }),
    ),
    fields: priceFields,
    confirmation: false,
    defaults: {},
  },
  specifications: {
    title: ["مواصفات العقار", "Property criteria"],
    schema: ranges(
      z.object({
        minBedrooms: searchSchema.shape.minBedrooms,
        minBathrooms: searchSchema.shape.minBathrooms,
        minArea: searchSchema.shape.minArea,
        maxArea: searchSchema.shape.maxArea,
        furnished: searchSchema.shape.furnished,
        rentFrequency: searchSchema.shape.rentFrequency,
      }),
    ),
    fields: specs,
    confirmation: false,
    defaults: {},
  },
  interests: {
    title: ["ما يهمك حول السكن", "What matters nearby"],
    schema: z
      .object({
        interests: z
          .array(z.enum(categories))
          .max(categories.length)
          .refine((values) => new Set(values).size === values.length),
      })
      .strict(),
    fields: [
      field("interests", "multi", "اهتماماتك", "Your interests", { options: categories }),
    ],
    confirmation: true,
    defaults: { interests: [] },
  },
  place: {
    title: ["إعداد مكان مؤقت", "Prepare a temporary place"],
    schema: placeSchema
      .extend({
        id: z.string().min(1).max(200).optional(),
        visitPerWeek: z.number().int().min(0).max(2147483647),
      })
      .strict(),
    fields: [
      field("name", "text", "اسم المكان", "Place name"),
      field("type", "select", "الغرض من المكان", "Place purpose", {
        options: ["work", "university", "school", "hospital", "family", "other"],
        custom: true,
      }),
      ...locationFields,
      field("visitPerWeek", "number", "زيارات في الأسبوع", "Visits per week", {
        min: 0,
        max: 2147483647,
      }),
      field("importance", "select", "الأهمية من 5", "Importance out of 5", {
        options: ["1", "2", "3", "4", "5"],
      }),
    ],
    confirmation: true,
    defaults: { name: "", type: "work", visitPerWeek: 5, importance: 3 },
  },
  destinations: {
    title: ["اختر وجهاتك", "Choose destinations"],
    schema: selected,
    fields: [field("ids", "places", "أماكن الحساب", "Account places")],
    confirmation: false,
    defaults: { ids: [] },
  },
  "saved-properties": {
    title: ["اختر من المحفوظات", "Choose saved properties"],
    schema: selected,
    fields: [field("ids", "properties", "العقارات المحفوظة", "Saved properties")],
    confirmation: false,
    defaults: { ids: [] },
  },
  comparison: {
    title: ["مقارنة العقارات", "Compare properties"],
    schema: selected.refine((value) => value.ids.length >= 2, {
      path: ["ids"],
      message: "Choose at least two",
    }),
    fields: [field("ids", "properties", "عقاران على الأقل", "At least two properties")],
    confirmation: false,
    defaults: { ids: [] },
  },
  services: {
    title: ["خدمات قريبة", "Nearby services"],
    schema: z
      .object({
        propertyIds: z.array(z.string()).max(1).optional(),
        categories: z.array(z.enum(categories)).min(1),
        radius: z.number().int().min(1).max(50000),
      })
      .strict(),
    fields: [
      field("propertyIds", "properties", "عقار (اختياري)", "Property (optional)", {
        optional: true,
      }),
      field("categories", "multi", "الخدمات المطلوبة", "Service categories", {
        options: categories,
      }),
      field("radius", "number", "نطاق البحث (متر)", "Search radius (meters)", {
        min: 1,
        max: 50000,
      }),
    ],
    confirmation: false,
    defaults: { categories: ["supermarket"], radius: 2000 },
  },
  commute: {
    title: ["إعداد تحليل التنقل", "Set up commute analysis"],
    schema: z
      .object({
        propertyIds: z.array(z.string()).length(1),
        ids: z.array(z.string()).min(1),
        mode: z.literal("driving"),
      })
      .strict(),
    fields: [
      field("propertyIds", "properties", "اختر عقارًا واحدًا", "Choose one property"),
      field("ids", "places", "وجهات التنقل", "Destinations"),
      field("mode", "select", "وسيلة التنقل المدعومة", "Supported transport", {
        options: ["driving"],
      }),
    ],
    confirmation: false,
    defaults: { propertyIds: [], ids: [], mode: "driving" },
  },
  housing: {
    title: ["نسخة تفضيلات مؤقتة", "Temporary preference copy"],
    schema: housingPreferenceSchema.extend({ interests: z.array(z.enum(categories)) }),
    fields: [
      field(
        "region",
        "region",
        "المنطقة المطلوبة للتفضيلات",
        "Region required by preferences",
      ),
      field("city", "city", "المدينة", "City"),
      field("district", "district", "الحي (اختياري)", "Neighborhood (optional)", {
        optional: true,
      }),
      field("listingType", "select", "إيجار أو شراء", "Rent or buy", {
        options: ["rent", "sale"],
      }),
      field("propertyType", "select", "نوع السكن", "Housing type", {
        options: ["apartment", "villa", "floor", "duplex", "building"],
      }),
      field(
        "maxBudget",
        "number",
        "الميزانية (ر.س، سنوية للإيجار)",
        "Budget (SAR, annual for rent)",
        { min: 1, step: "any" },
      ),
      field("occupantsCount", "number", "عدد السكان", "Occupants", {
        min: 1,
        max: 2147483647,
      }),
      field("interests", "multi", "الاهتمامات", "Interests", { options: categories }),
    ],
    confirmation: true,
    defaults: {
      region: "",
      city: "",
      listingType: "rent",
      propertyType: "apartment",
      occupantsCount: 1,
      interests: [],
    },
  },
  home: {
    title: [
      "البيت وتاريخ الانتقال (اختيار مؤقت)",
      "Home and move-in date (temporary selection)",
    ],
    schema: currentHomeSchema.extend({
      movedInAt: z.union([z.iso.date(), z.literal("")]).optional(),
    }),
    fields: [
      ...locationFields,
      field("movedInAt", "date", "تاريخ الانتقال (اختياري)", "Move-in date (optional)", {
        optional: true,
      }),
      field(
        "externalPropertyId",
        "text",
        "مرجع إعلان (اختياري)",
        "Listing reference (optional)",
        { optional: true },
      ),
      field("source", "text", "مصدر الإعلان (اختياري)", "Listing source (optional)", {
        optional: true,
      }),
    ],
    confirmation: true,
    defaults: { movedInAt: "" },
  },
  "property-reference": {
    title: [
      "إضافة مرجع عقار (اختيار مؤقت)",
      "Add a property reference (temporary selection)",
    ],
    schema: savedPropertySchema.extend({ titleSnapshot: z.string().max(200).optional() }),
    fields: [
      field("titleSnapshot", "text", "عنوان اختياري", "Optional title", {
        optional: true,
      }),
      field("source", "text", "المصدر", "Source"),
      field("externalPropertyId", "text", "معرّف الإعلان", "Listing reference"),
    ],
    confirmation: true,
    defaults: { titleSnapshot: "", source: "", externalPropertyId: "" },
  },
  location: {
    title: ["موقع مؤقت من الخريطة", "Temporary location from map"],
    schema: z
      .object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      })
      .strict(),
    fields: locationFields,
    confirmation: false,
    defaults: {},
  },
  weights: {
    title: ["أوزان التحليل (اختيار مؤقت)", "Analysis weights (temporary selection)"],
    schema: weightsSchema,
    fields: [
      field("housingWeight", "number", "السكن %", "Housing %", { min: 0, max: 100 }),
      field("commuteWeight", "number", "التنقل %", "Commute %", { min: 0, max: 100 }),
      field("servicesWeight", "number", "الخدمات %", "Services %", { min: 0, max: 100 }),
    ],
    confirmation: false,
    defaults: { housingWeight: 40, commuteWeight: 40, servicesWeight: 20 },
  },
  analysis: {
    title: ["معاينة تحليل أو تقرير", "Preview an analysis or report"],
    schema: z
      .object({
        ids: z.array(z.string()).length(1),
        report: z.enum(["affordability", "match", "neighborhood"]),
      })
      .strict(),
    fields: [
      field("ids", "properties", "اختر عقارًا واحدًا", "Choose one property"),
      field("report", "select", "نوع المعاينة", "Preview type", {
        options: ["affordability", "match", "neighborhood"],
      }),
    ],
    confirmation: false,
    defaults: { ids: [], report: "affordability" },
  },
  "home-remove": {
    title: ["إزالة البيت (اختيار مؤقت)", "Remove home (temporary selection)"],
    schema: z.object({}).strict(),
    fields: [],
    confirmation: true,
    defaults: {},
  },
  "housing-remove": {
    title: ["إزالة التفضيلات (اختيار مؤقت)", "Remove preferences (temporary selection)"],
    schema: z.object({}).strict(),
    fields: [],
    confirmation: true,
    defaults: {},
  },
  "confirm-move": {
    title: ["تأكيد الانتقال (اختيار مؤقت)", "Confirm move-in (temporary selection)"],
    schema: z.object({}).strict(),
    fields: [],
    confirmation: true,
    defaults: {},
  },
  "comparison-select": {
    title: ["اختيار للمقارنة", "Select for comparison"],
    schema: z.object({ id: z.string().min(1).max(200), selected: z.boolean() }).strict(),
    fields: [],
    confirmation: false,
    defaults: {},
  },
  "save-property": {
    title: ["تغيير حفظ عقار (اختيار مؤقت)", "Change property save (temporary selection)"],
    schema: z.object({ id: z.string().min(1).max(200), save: z.boolean() }).strict(),
    fields: [],
    confirmation: true,
    defaults: {},
  },
  "remove-place": {
    title: ["إزالة مكان (اختيار مؤقت)", "Remove place (temporary selection)"],
    schema: z.object({ id: z.string().min(1).max(200) }).strict(),
    fields: [],
    confirmation: true,
    defaults: {},
  },
  "reset-search": {
    title: ["مسح البحث المؤقت", "Clear temporary search"],
    schema: z.object({}).strict(),
    fields: [],
    confirmation: false,
    defaults: {},
  },
  navigation: {
    title: ["افتح قسمًا في مدار", "Open a MADAR section"],
    schema: z
      .object({
        route: z.enum([
          "/dashboard",
          "/properties",
          "/saved",
          "/profile",
          "/locations",
          "/interests",
          "/compare",
          "/neighborhood",
          "/payments",
          "/login",
          "/register",
        ]),
      })
      .strict(),
    fields: [
      field("route", "select", "القسم", "Section", {
        options: [
          "/dashboard",
          "/properties",
          "/saved",
          "/profile",
          "/locations",
          "/interests",
          "/compare",
          "/neighborhood",
          "/payments",
          "/login",
          "/register",
        ],
      }),
    ],
    confirmation: false,
    defaults: { route: "/properties" },
  },
};
