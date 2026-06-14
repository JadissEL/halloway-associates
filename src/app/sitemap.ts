import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { allIndexablePaths } from "@/lib/seo/sitemap-paths";
import { localePath } from "@/lib/seo/site";

const BUILD_DATE =
  process.env.NEXT_PUBLIC_BUILD_DATE ?? "2026-06-14T00:00:00.000Z";

function priorityForPath(path: string): number {
  if (path === "") return 1;
  if (path === "/services") return 0.9;
  if (path.startsWith("/services/")) return 0.85;
  return 0.8;
}

function changeFrequencyForPath(
  path: string,
): "weekly" | "monthly" | "yearly" {
  if (path === "") return "weekly";
  if (path.startsWith("/services")) return "monthly";
  return "monthly";
}

export default function sitemap(): MetadataRoute.Sitemap {
  return routing.locales.flatMap((locale) =>
    allIndexablePaths().map((path) => ({
      url: localePath(locale, path),
      lastModified: BUILD_DATE,
      changeFrequency: changeFrequencyForPath(path),
      priority: priorityForPath(path),
    })),
  );
}
