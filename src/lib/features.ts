export const featureFlags = {
  showWork: false,
  showTestimonials: false,
  showPress: false,
  showInsights: false,
} as const;

export type FeatureFlag = keyof typeof featureFlags;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return featureFlags[flag];
}
