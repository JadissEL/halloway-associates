import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { ServiceIcon } from "@/components/icons/ServiceIcon";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/seo/json-ld";
import {
  getService,
  isServiceId,
  services,
  type ServiceId,
} from "@/lib/services-data";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    services.map((service) => ({ locale, slug: service.id })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isServiceId(slug)) {
    return { title: "Not found" };
  }

  const t = await getTranslations({ locale, namespace: "servicesPage.items" });
  const title = t(`${slug}.title`);
  const description = t(`${slug}.summary`);

  return buildPageMetadata({
    locale,
    path: `/services/${slug}`,
    title: `${title} | Halloway & Associates`,
    description,
    ogTitle: title,
    ogImagePath: `/${locale}/services/${slug}/opengraph-image`,
    keywords: [
      title,
      "Halloway & Associates",
      "Production Lab",
      getService(slug).category,
    ],
  });
}

export default async function ServiceDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isServiceId(slug)) {
    notFound();
  }

  setRequestLocale(locale);
  const service = getService(slug);
  const tPage = await getTranslations("servicesPage");
  const tItems = await getTranslations("servicesPage.items");
  const tNav = await getTranslations("nav");
  const tSeo = await getTranslations("seo");

  const title = tItems(`${slug}.title`);
  const summary = tItems(`${slug}.summary`);
  const details = tItems(`${slug}.details`);

  const breadcrumbs = [
    { name: tNav("home"), path: "" },
    { name: tNav("services"), path: "/services" },
    { name: title, path: `/services/${slug}` },
  ];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(locale, breadcrumbs),
          serviceJsonLd(locale, slug, title, summary),
        ]}
      />
      <article className="section-padding">
        <div className="container-wide max-w-3xl">
          <Breadcrumbs
            items={[
              { label: tNav("home"), href: "/" },
              { label: tNav("services"), href: "/services" },
              { label: title },
            ]}
          />
          <ServiceIcon name={service.icon} size="lg" className="mb-6" />
          <p className="eyebrow mb-4">{tPage("eyebrow")}</p>
          <h1 className="headline mb-4">{title}</h1>
          <p className="subhead mb-8">{summary}</p>
          <div className="prose-spacing space-y-4 text-base leading-relaxed text-ink-secondary">
            <p>{details}</p>
          </div>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href={`/contact?focus=${service.category}`}
              className="inline-flex rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white no-underline"
            >
              {tPage("discussCapability")}
            </Link>
            <Link
              href="/services"
              className="inline-flex rounded-full border border-line px-6 py-3 text-sm font-semibold text-ink no-underline hover:bg-lavender/30"
            >
              {tSeo("allServices")}
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}
