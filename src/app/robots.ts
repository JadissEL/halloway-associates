import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/trpc/", "/*/account", "/*/sign-in", "/*/sign-up", "/*/app"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
