import path from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Pin the workspace root explicitly: a stray lockfile in a parent directory
  // (outside this repo) can otherwise make Next mis-infer the root and sweep
  // unrelated files (e.g. the separate modal/ app) into this build.
  turbopack: {
    root: path.join(__dirname),
  },
  // A conservative baseline, not a full CSP — this site loads GA4 and
  // Vercel Analytics scripts, and a strict script-src would need careful
  // allowlisting to avoid breaking them. Revisit with a real CSP later.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
