import type { MetadataRoute } from "next";
import { SITEMAP_ENTRIES, SITEMAP_LOCALES } from "@/lib/seo/sitemap-paths";
import { LOCALE_HREFLANG, localePath } from "@/lib/seo/site";

// The checked-in .env.example used to pin this placeholder. Treat it as unset
// so a copied env var cannot freeze lastmod on a date the content did not change.
const STALE_BUILD_DATE = "2026-06-14T00:00:00.000Z";

function resolveLastModified(): Date {
  const raw = process.env.NEXT_PUBLIC_BUILD_DATE?.trim();
  if (raw && raw !== STALE_BUILD_DATE) {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

const LAST_MODIFIED = resolveLastModified();

export default function sitemap(): MetadataRoute.Sitemap {
  return SITEMAP_LOCALES.flatMap((locale) =>
    SITEMAP_ENTRIES.map(({ path, priority, changeFrequency }) => ({
      url: localePath(locale, path),
      lastModified: LAST_MODIFIED,
      changeFrequency,
      priority,
      alternates: {
        languages: {
          ...Object.fromEntries(
            SITEMAP_LOCALES.map((alternate) => [
              LOCALE_HREFLANG[alternate],
              localePath(alternate, path),
            ]),
          ),
          "x-default": localePath("en", path),
        },
      },
    })),
  );
}
