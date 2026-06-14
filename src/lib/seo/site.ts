import { routing } from "@/i18n/routing";

export const SITE_NAME = "Halloway & Associates";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.hallowayassociates.com";
export const SITE_EMAIL = "hello@hallowayassociates.com";

export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

export const LOCALE_OG: Record<(typeof routing.locales)[number], string> = {
  en: "en_CA",
  fr: "fr_CA",
};

export const LOCALE_HREFLANG: Record<(typeof routing.locales)[number], string> = {
  en: "en",
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
