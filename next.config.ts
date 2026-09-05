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
};

export default withNextIntl(nextConfig);
