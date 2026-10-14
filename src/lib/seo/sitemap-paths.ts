// Paths listed in sitemap.xml. Ordered by business priority for Halloway:
// rentals, relocation, business setup, staffing, and the expert network.
//
// The legacy AI-studio pages (/studio, /services, /services/*) stay reachable
// but are not advertised: they are off-topic for a Greek rentals, relocation,
// and staffing platform, and they carry noindex.
// /insights stays out because it is a feature-flagged stub that is already noindex.
export const SITEMAP_ENTRIES: {
  path: string;
  priority: number;
  changeFrequency: "daily" | "weekly" | "monthly";
}[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/properties", priority: 0.95, changeFrequency: "daily" },
  { path: "/greece", priority: 0.9, changeFrequency: "monthly" },
  { path: "/business-setup", priority: 0.9, changeFrequency: "monthly" },
  { path: "/staffing", priority: 0.9, changeFrequency: "monthly" },
  { path: "/experts", priority: 0.85, changeFrequency: "monthly" },
  { path: "/professionals", priority: 0.8, changeFrequency: "weekly" },
  { path: "/jobs", priority: 0.8, changeFrequency: "daily" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.6, changeFrequency: "monthly" },
  { path: "/book-a-call", priority: 0.6, changeFrequency: "monthly" },
];

/** Locales advertised in the sitemap (Greek market: English + Greek). */
export const SITEMAP_LOCALES = ["en", "el"] as const;

export function allIndexablePaths(): string[] {
  return SITEMAP_ENTRIES.map((entry) => entry.path);
}
