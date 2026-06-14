import type { MetadataRoute } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/seo/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "Halloway",
    description:
      "AI, automation, and growth engineering studio — production-grade systems for global teams.",
    start_url: "/en",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#3d3450",
    lang: "en",
    icons: [
      {
        src: "/brand/logo-mark.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
