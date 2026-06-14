import type { Metadata } from "next";
import {
  hreflangAlternates,
  LOCALE_OG,
  localePath,
  OG_IMAGE_SIZE,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo/site";

type PageMetadataInput = {
  locale: string;
  path?: string;
  title: string;
  description: string;
  keywords?: string[];
  noindex?: boolean;
  ogTitle?: string;
  ogImagePath?: string;
};

export function buildPageMetadata({
  locale,
  path = "",
  title,
  description,
  keywords,
  noindex = false,
  ogTitle,
  ogImagePath,
}: PageMetadataInput): Metadata {
  const canonical = localePath(locale, path);
  const ogLocale = LOCALE_OG[locale as keyof typeof LOCALE_OG] ?? "en_CA";
  const ogImage = ogImagePath ?? `/${locale}/opengraph-image`;

  const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    keywords,
    alternates: {
      canonical,
      languages: hreflangAlternates(path),
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: ogTitle ?? title,
      description,
      url: canonical,
      locale: ogLocale,
      alternateLocale: Object.values(LOCALE_OG).filter((l) => l !== ogLocale),
      images: [
        {
          url: ogImage,
          width: OG_IMAGE_SIZE.width,
          height: OG_IMAGE_SIZE.height,
          alt: ogTitle ?? title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle ?? title,
      description,
      images: [ogImage],
    },
    robots: noindex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
  };

  const googleVerification = process.env.GOOGLE_SITE_VERIFICATION;
  if (googleVerification) {
    metadata.verification = { google: googleVerification };
  }

  return metadata;
}
