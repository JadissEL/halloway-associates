import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { ContactForm } from "@/components/contact/ContactForm";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, contactPageJsonLd } from "@/lib/seo/json-ld";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contactPage" });

  return buildPageMetadata({
    locale,
    path: "/contact",
    title: `${t("title")} | Halloway & Associates`,
    description: t("subtitle"),
    ogTitle: t("title"),
    keywords: [
      "contact Halloway & Associates",
      "discovery call",
      "AI automation consultation",
    ],
  });
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contactPage");
  const tNav = await getTranslations("nav");

  const breadcrumbs = [
    { name: tNav("home"), path: "" },
    { name: tNav("contact"), path: "/contact" },
  ];

  return (
    <>
      <JsonLd
        data={[breadcrumbJsonLd(locale, breadcrumbs), contactPageJsonLd(locale)]}
      />
      <div className="section-padding">
        <div className="container-wide grid gap-16 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <div>
            <Breadcrumbs
              items={[
                { label: tNav("home"), href: "/" },
                { label: tNav("contact") },
              ]}
              className="mb-8"
            />
            <p className="eyebrow mb-4">{t("eyebrow")}</p>
            <h1 className="headline mb-4">{t("title")}</h1>
            <p className="subhead mb-10">{t("subtitle")}</p>
            <div className="rounded-[16px] border border-line bg-page p-6">
              <p className="mb-2 text-sm font-semibold text-ink">{t("direct.title")}</p>
              <a href={`mailto:${t("direct.email")}`} className="block font-medium">
                {t("direct.email")}
              </a>
              <a
                href="https://www.hallowayassociates.com"
                className="mt-2 block text-sm text-ink-secondary"
              >
                {t("direct.website")}
              </a>
            </div>
          </div>
          <div className="rounded-[24px] border border-line bg-surface p-8 md:p-10">
            <Suspense fallback={<div className="h-64 animate-pulse rounded-[12px] bg-lavender" />}>
              <ContactForm />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
}
