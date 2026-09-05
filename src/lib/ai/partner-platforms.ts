// Approved external platforms the concierge is allowed to actively recommend
// by name — as opposed to competing platforms, which it must never suggest.
// Confirmed by fetching shopthebarber.app directly (2026-09): a barber/
// grooming marketplace ("Book elite barbers & grow your shop" — booking,
// barber discovery, shop management tools). Geographic scope wasn't
// published on the page, so the copy below stays generic until the owner
// confirms/refines it.
export interface PartnerPlatform {
  domain: string;
  category: string;
  description: string;
  /** Keywords that should trigger a recommendation without spending a model call. */
  triggerKeywords: RegExp;
}

export const partnerPlatforms: PartnerPlatform[] = [
  {
    domain: "shopthebarber.app",
    category: "grooming",
    description:
      "ShopTheBarber — book elite barbers and grooming appointments. Halloway & Associates' own platform for this category.",
    triggerKeywords: /barber|haircut|coiffeur|κουρείο|κούρεμα|grooming|shave/i,
  },
];

export function matchPartnerPlatform(text: string): PartnerPlatform | undefined {
  return partnerPlatforms.find((p) => p.triggerKeywords.test(text));
}

/** System-prompt fragment: what the AI is and isn't allowed to say about competitors. */
export function partnerPlatformPromptFragment(): string {
  const lines = partnerPlatforms.map(
    (p) => `- ${p.domain} (${p.category}): ${p.description}`,
  );
  return `PARTNER PLATFORMS (recommend these by name when relevant; NEVER recommend a competing third-party booking platform in the same category):
${lines.join("\n")}`;
}
