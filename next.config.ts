import path from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // tesseract.js spawns its recognition worker via a require()'d path
  // relative to its own package directory (src/lib/media/ocr.ts) — bundling
  // it (the Turbopack/webpack default for server code) rewrites that path
  // and breaks worker resolution at runtime ("Cannot find module
  // .../tesseract.js/src/worker-script/node/index.js", confirmed by
  // running it). Marking it external keeps Next.js from bundling it, so it
  // loads via plain require() with its real on-disk relative paths intact —
  // the documented fix for this exact class of native/worker-script package.
  // ffmpeg-static resolves its bundled binary's path relative to its own
  // package directory too (src/lib/media/video.ts) — same class of bug as
  // tesseract.js above if Next bundles it.
  serverExternalPackages: ["tesseract.js", "ffmpeg-static"],
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
