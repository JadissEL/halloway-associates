// Dynamic listing taxonomy — the schema the whole multimodal pipeline reads
// from instead of hardcoding a separate workflow per listing type (spec
// section 7). A listing kind declares its fields, its media categories, and
// its completeness weighting; everything downstream (classification,
// completeness scoring, the workflow tools, the system prompt) walks this
// registry rather than special-casing "property" by name.
//
// Only PROPERTY is wired to a real Prisma model and real MCP tools today —
// see src/mcp/tools/properties.ts. The other entries below are deliberately
// NOT included yet: adding a fake VEHICLE/BUSINESS taxonomy with no backing
// table and no tools would be exactly the "disconnected component" this
// upgrade was told not to ship. Extending to a new vertical means: (1) a
// Prisma model, (2) a ListingTaxonomy entry here, (3) three MCP tools
// mirroring create/update/submit_property_draft — the pattern is proven
// once, not promised.

export type FieldKind = "string" | "number" | "boolean" | "enum";

export interface ListingFieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  required: boolean;
  enumValues?: readonly string[];
  /** Rough weight in the completeness score — required fields default higher. */
  weight?: number;
}

export interface MediaCategoryDef {
  key: string;
  label: string;
  /** Keywords (multi-locale) used by the heuristic classifier — see classification.ts. */
  keywords: Partial<Record<"en" | "el" | "fr", string[]>>;
  /** At least one photo in this category is expected for a complete listing. */
  recommended: boolean;
  /** The listing cannot be submitted without at least one photo in this category. */
  required: boolean;
}

export interface ListingTaxonomy {
  kind: string;
  label: string;
  fields: ListingFieldDef[];
  mediaCategories: MediaCategoryDef[];
  /** Media below this count is flagged as "add more photos" even if every category is covered. */
  recommendedMediaCount: number;
}

const PROPERTY_MEDIA_CATEGORIES: MediaCategoryDef[] = [
  { key: "exterior", label: "Exterior", required: true, recommended: true, keywords: {
    en: ["exterior", "front", "facade", "building", "outside"], el: ["εξωτερικό", "πρόσοψη", "κτίριο"], fr: ["extérieur", "façade", "immeuble"] } },
  { key: "entrance", label: "Entrance", required: false, recommended: true, keywords: {
    en: ["entrance", "entry", "door", "hallway", "hall"], el: ["είσοδος", "χωλ", "διάδρομος"], fr: ["entrée", "hall", "couloir"] } },
  { key: "living_room", label: "Living room", required: true, recommended: true, keywords: {
    en: ["living room", "lounge", "sitting room", "living"], el: ["σαλόνι", "καθιστικό"], fr: ["salon", "séjour"] } },
  { key: "bedroom", label: "Bedroom", required: true, recommended: true, keywords: {
    en: ["bedroom", "bed room", "bed"], el: ["υπνοδωμάτιο", "κρεβατοκάμαρα"], fr: ["chambre", "chambre à coucher"] } },
  { key: "master_bedroom", label: "Master bedroom", required: false, recommended: false, keywords: {
    en: ["master bedroom", "main bedroom", "master"], el: ["κύριο υπνοδωμάτιο"], fr: ["chambre principale", "suite parentale"] } },
  { key: "kitchen", label: "Kitchen", required: true, recommended: true, keywords: {
    en: ["kitchen", "kitchenette"], el: ["κουζίνα"], fr: ["cuisine"] } },
  { key: "bathroom", label: "Bathroom", required: true, recommended: true, keywords: {
    en: ["bathroom", "bath", "shower"], el: ["μπάνιο", "λουτρό"], fr: ["salle de bain", "douche"] } },
  { key: "wc", label: "WC", required: false, recommended: false, keywords: {
    en: ["wc", "toilet", "restroom", "powder room"], el: ["τουαλέτα", "wc"], fr: ["wc", "toilettes"] } },
  { key: "dining_room", label: "Dining room", required: false, recommended: false, keywords: {
    en: ["dining room", "dining"], el: ["τραπεζαρία"], fr: ["salle à manger"] } },
  { key: "balcony", label: "Balcony", required: false, recommended: true, keywords: {
    en: ["balcony"], el: ["μπαλκόνι"], fr: ["balcon"] } },
  { key: "terrace", label: "Terrace", required: false, recommended: false, keywords: {
    en: ["terrace", "patio", "deck"], el: ["βεράντα", "ταράτσα"], fr: ["terrasse"] } },
  { key: "garden", label: "Garden", required: false, recommended: false, keywords: {
    en: ["garden", "yard", "backyard"], el: ["κήπος", "αυλή"], fr: ["jardin", "cour"] } },
  { key: "pool", label: "Pool", required: false, recommended: false, keywords: {
    en: ["pool", "swimming pool"], el: ["πισίνα"], fr: ["piscine"] } },
  { key: "garage", label: "Garage", required: false, recommended: false, keywords: {
    en: ["garage"], el: ["γκαράζ"], fr: ["garage"] } },
  { key: "parking", label: "Parking", required: false, recommended: false, keywords: {
    en: ["parking", "parking spot", "car park"], el: ["πάρκινγκ", "θέση στάθμευσης"], fr: ["parking", "stationnement"] } },
  { key: "storage", label: "Storage", required: false, recommended: false, keywords: {
    en: ["storage", "storage room", "cellar", "basement"], el: ["αποθήκη", "υπόγειο"], fr: ["cave", "cellier", "rangement"] } },
  { key: "hallway", label: "Hallway", required: false, recommended: false, keywords: {
    en: ["hallway", "corridor", "landing"], el: ["διάδρομος"], fr: ["couloir", "palier"] } },
  { key: "view", label: "View", required: false, recommended: false, keywords: {
    en: ["view", "sea view", "mountain view", "cityscape"], el: ["θέα"], fr: ["vue"] } },
  { key: "building_common_areas", label: "Building / common areas", required: false, recommended: false, keywords: {
    en: ["lobby", "elevator", "stairwell", "common area", "rooftop"], el: ["κοινόχρηστοι χώροι", "ασανσέρ"], fr: ["parties communes", "ascenseur"] } },
  { key: "floor_plan", label: "Floor plan", required: false, recommended: true, keywords: {
    en: ["floor plan", "floorplan", "blueprint", "layout"], el: ["κάτοψη"], fr: ["plan", "plan de l'appartement"] } },
  { key: "other", label: "Other", required: false, recommended: false, keywords: { en: [], el: [], fr: [] } },
];

const PROPERTY_FIELDS: ListingFieldDef[] = [
  { key: "listingIntent", label: "For sale or rent", kind: "enum", required: true, enumValues: ["RENT", "SALE"], weight: 3 },
  { key: "propertyType", label: "Property type", kind: "enum", required: true, enumValues: ["ROOM", "APARTMENT", "HOUSE", "LAND", "COMMERCIAL"], weight: 3 },
  { key: "city", label: "City", kind: "string", required: true, weight: 3 },
  { key: "area", label: "Neighbourhood / area", kind: "string", required: false, weight: 1 },
  { key: "livingAreaSqm", label: "Living area (m²)", kind: "number", required: true, weight: 2 },
  { key: "priceAmount", label: "Price", kind: "number", required: true, weight: 3 },
  { key: "title", label: "Title", kind: "string", required: true, weight: 2 },
  { key: "description", label: "Description", kind: "string", required: true, weight: 2 },
  { key: "bedrooms", label: "Bedrooms", kind: "number", required: false, weight: 1 },
  { key: "furnished", label: "Furnished", kind: "boolean", required: false, weight: 1 },
];

export const PROPERTY_TAXONOMY: ListingTaxonomy = {
  kind: "PROPERTY",
  label: "Property",
  fields: PROPERTY_FIELDS,
  mediaCategories: PROPERTY_MEDIA_CATEGORIES,
  recommendedMediaCount: 6,
};

const REGISTRY: Record<string, ListingTaxonomy> = {
  PROPERTY: PROPERTY_TAXONOMY,
};

export function getTaxonomy(kind: string): ListingTaxonomy | null {
  return REGISTRY[kind] ?? null;
}

export function listMediaCategoryKeys(kind: string): string[] {
  return getTaxonomy(kind)?.mediaCategories.map((c) => c.key) ?? [];
}
