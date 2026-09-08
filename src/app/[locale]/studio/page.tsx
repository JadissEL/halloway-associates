import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";

// This page is the original Halloway & Associates homepage (the B2B AI/
// automation/growth "Production Lab" studio offering), relocated from `/`
// to `/studio` as part of the Greece marketplace pivot — content unchanged,
// still fully reachable via the "Studio" nav item. `/` now hosts the new
// AI-first marketplace shell. See PLATFORM.md for the SEO tradeoff this
// relocation implies (the previously-indexed root URL now serves different
// content) and the redirect/canonical handling in next.config + robots.
const HomePageSections = dynamic(
  () =>
    import("@/components/home/HomePageSections").then((mod) => mod.HomePageSections),
  {
    ssr: true,
    loading: () => (
      <div className="min-h-[60vh] animate-pulse bg-luxury-graphite section-padding" aria-hidden />
    ),
  },
);

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return buildPageMetadata({
    locale,
    path: "studio",
    title: t("title"),
    description: t("description"),
    keywords: t("keywords").split("|").map((k) => k.trim()),
  });
}

export default async function StudioPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tNav = await getTranslations("nav");

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(locale, [{ name: tNav("studio"), path: "studio" }])}
      />
      <div className="luxury-surface min-h-screen text-luxury-ivory">
        <HomePageSections />
      </div>
    </>
  );
}
