import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { ServiceExplorer } from "@/components/services/ServiceExplorer";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, serviceListJsonLd } from "@/lib/seo/json-ld";
import { services } from "@/lib/services-data";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "servicesPage" });

  return buildPageMetadata({
    locale,
    path: "/services",
    title: `${t("title")} | Halloway & Associates`,
    description: t("subtitle"),
    ogTitle: t("title"),
    ogImagePath: `/${locale}/services/opengraph-image`,
    keywords: [
      "AI automation",
      "MVP development",
      "growth engineering",
      "Production Lab",
      ...services.map((s) => s.id),
    ],
  });
}

export default async function ServicesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("servicesPage");
  const tNav = await getTranslations("nav");
  const tItems = await getTranslations("servicesPage.items");

  const breadcrumbs = [
    { name: tNav("home"), path: "" },
    { name: tNav("services"), path: "/services" },
  ];

  const listItems = services.map((s) => ({
    id: s.id,
    name: tItems(`${s.id}.title`),
  }));

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(locale, breadcrumbs),
          serviceListJsonLd(locale, listItems),
        ]}
      />
      <div className="section-padding">
        <div className="container-wide">
          <Breadcrumbs
            items={[
              { label: tNav("home"), href: "/" },
              { label: tNav("services") },
            ]}
          />
          <div className="mb-14 max-w-2xl">
            <p className="eyebrow mb-4">{t("eyebrow")}</p>
            <h1 className="headline mb-4">{t("title")}</h1>
            <p className="subhead">{t("subtitle")}</p>
          </div>
          <Suspense fallback={<div className="h-40 animate-pulse rounded-[16px] bg-lavender" />}>
            <ServiceExplorer />
          </Suspense>
        </div>
      </div>
    </>
  );
}
