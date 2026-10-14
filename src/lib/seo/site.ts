import { routing } from "@/i18n/routing";

export const SITE_NAME = "Halloway & Associates";
export const SITE_EMAIL = "hello@hallowayassociates.com";

/** Apex production origin. www redirects here and must not appear in canonicals. */
export const CANONICAL_ORIGIN = "https://hallowayassociates.com";

function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return CANONICAL_ORIGIN;
  try {
    const url = new URL(raw);
    // A stale Render env of https://www.hallowayassociates.com would otherwise
    // override the default and point every canonical, sitemap loc, and
    // robots Sitemap line at the redirecting host.
    if (url.hostname === "www.hallowayassociates.com") {
      return CANONICAL_ORIGIN;
    }
    return url.origin;
  } catch {
    return CANONICAL_ORIGIN;
  }
}

export const SITE_URL = resolveSiteUrl();

export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

export const LOCALE_OG: Record<(typeof routing.locales)[number], string> = {
  en: "en_GR",
  el: "el_GR",
  fr: "fr_FR",
};

export const LOCALE_HREFLANG: Record<(typeof routing.locales)[number], string> = {
  en: "en-GR",
  el: "el-GR",
  fr: "fr",
};

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

export function localePath(
  locale: string,
  path = "",
): string {
  const suffix = path.startsWith("/") ? path : path ? `/${path}` : "";
  return absoluteUrl(`/${locale}${suffix}`);
}

export function hreflangAlternates(path = ""): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[LOCALE_HREFLANG[locale]] = localePath(locale, path);
  }
  languages["x-default"] = localePath(routing.defaultLocale, path);
  return languages;
}
