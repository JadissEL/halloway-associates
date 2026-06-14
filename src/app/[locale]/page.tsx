import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";

const HomePageSections = dynamic(
  () =>
    import("@/components/home/HomePageSections").then((mod) => mod.HomePageSections),
  {
    ssr: true,
    loading: () => (
      <div className="min-h-[60vh] animate-pulse bg-page section-padding" aria-hidden />
    ),
  },
);

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return buildPageMetadata({
    locale,
    path: "",
    title: t("title"),
    description: t("description"),
    keywords: t("keywords").split("|").map((k) => k.trim()),
  });
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tNav = await getTranslations("nav");

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(locale, [{ name: tNav("home"), path: "" }])}
      />
      <HomePageSections />
    </>
  );
}
