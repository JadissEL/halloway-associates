import { getTaxonomy } from "./taxonomy";

// Deterministic completeness scoring (spec section 24: "do not invent
// arbitrary percentages with an LLM"). Pure arithmetic over the taxonomy's
// declared required/optional fields and media categories — same inputs
// always produce the same score, and every missing item is individually
// nameable, not just a number.

export interface CompletenessInput {
  listingKind: string;
  fields: Record<string, unknown>;
  mediaCategoriesPresent: string[]; // detectedCategory values already confirmed/high-confidence on this listing's media
  mediaCount: number;
}

export interface CompletenessResult {
  percent: number; // 0-100
  missingRequiredFields: string[];
  missingRequiredMedia: string[];
  missingRecommendedMedia: string[];
  needsMorePhotos: boolean;
}

function isFieldPresent(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  return true;
}

export function computeCompleteness(input: CompletenessInput): CompletenessResult {
  const taxonomy = getTaxonomy(input.listingKind);
  if (!taxonomy) {
    return { percent: 0, missingRequiredFields: [], missingRequiredMedia: [], missingRecommendedMedia: [], needsMorePhotos: false };
  }

  const requiredFields = taxonomy.fields.filter((f) => f.required);
  const optionalFields = taxonomy.fields.filter((f) => !f.required);
  const requiredMedia = taxonomy.mediaCategories.filter((c) => c.required);
  const recommendedMedia = taxonomy.mediaCategories.filter((c) => c.recommended);

  const missingRequiredFields = requiredFields.filter((f) => !isFieldPresent(input.fields[f.key])).map((f) => f.label);
  const missingRequiredMedia = requiredMedia
    .filter((c) => !input.mediaCategoriesPresent.includes(c.key))
    .map((c) => c.label);
  const missingRecommendedMedia = recommendedMedia
    .filter((c) => !input.mediaCategoriesPresent.includes(c.key))
    .map((c) => c.label);

  // Weighted: required fields carry the most weight, then required media,
  // then optional fields, then recommended (non-required) media — matches
  // "a listing can technically publish without a floor plan photo, but not
  // without a price."
  const totalWeight =
    requiredFields.reduce((sum, f) => sum + (f.weight ?? 2) * 2, 0) +
    requiredMedia.length * 3 +
    optionalFields.reduce((sum, f) => sum + (f.weight ?? 1), 0) +
    recommendedMedia.length * 1;

  const earnedWeight =
    requiredFields.reduce((sum, f) => sum + (isFieldPresent(input.fields[f.key]) ? (f.weight ?? 2) * 2 : 0), 0) +
    requiredMedia.filter((c) => input.mediaCategoriesPresent.includes(c.key)).length * 3 +
    optionalFields.reduce((sum, f) => sum + (isFieldPresent(input.fields[f.key]) ? (f.weight ?? 1) : 0), 0) +
    recommendedMedia.filter((c) => input.mediaCategoriesPresent.includes(c.key)).length * 1;

  const percent = totalWeight === 0 ? 0 : Math.round((earnedWeight / totalWeight) * 100);

  return {
    percent,
    missingRequiredFields,
    missingRequiredMedia,
    missingRecommendedMedia,
    needsMorePhotos: input.mediaCount < taxonomy.recommendedMediaCount,
  };
}
