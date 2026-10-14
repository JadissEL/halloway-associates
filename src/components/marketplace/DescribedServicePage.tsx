import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { SITE_URL, localePath } from "@/lib/seo/site";

export type DescribedServiceConfig = {
  namespace: string;
  path: string;
  serviceType: string;
  focus: string;
  audiences: { key: string; icon: LucideIcon }[];
  topics: { key: string; icon: LucideIcon }[];
  steps: readonly string[];
  areaServed: { "@type": string; name: string }[];
};

type Props = {
  locale: string;
  config: DescribedServiceConfig;
};

export async function describedServiceMetadata(locale: string, config: DescribedServiceConfig) {
  const t = await getTranslations({ locale, namespace: config.namespace });

  return buildPageMetadata({
    locale,
    path: config.path,
    title: `${t("title")} | Halloway & Associates`,
    description: t("metaDescription"),
    ogTitle: t("title"),
    keywords: t("keywords").split("|").map((keyword) => keyword.trim()),
  });
}

export async function DescribedServicePage({ locale, config }: Props) {
  setRequestLocale(locale);
  const t = await getTranslations(config.namespace);
  const tNav = await getTranslations("nav");

  const breadcrumbs = [
    { name: tNav("home"), path: "" },
    { name: t("eyebrow"), path: config.path },
  ];

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${localePath(locale, config.path)}#service`,
    name: t("title"),
    description: t("metaDescription"),
    serviceType: config.serviceType,
    url: localePath(locale, config.path),
    provider: { "@id": `${SITE_URL}/#organization` },
    areaServed: config.areaServed,
  };

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(locale, breadcrumbs), serviceJsonLd]} />
      <article className="luxury-surface min-h-screen section-padding text-luxury-ivory">
        <div className="container-wide">
          <Breadcrumbs
            items={[
              { label: tNav("home"), href: "/" },
              { label: t("eyebrow") },
            ]}
          />

          <header className="mb-16 max-w-3xl">
            <p className="eyebrow mb-4">{t("eyebrow")}</p>
            <h1 className="text-page-title mb-6">{t("title")}</h1>
            <p className="subhead">{t("intro")}</p>
          </header>

          <section className="mb-20">
            <p className="eyebrow mb-4">{t("audiences.eyebrow")}</p>
            <h2 className="text-section-title mb-10 max-w-3xl">{t("audiences.title")}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {config.audiences.map(({ key, icon: Icon }) => (
                <article
                  key={key}
                  className="border border-luxury-border bg-luxury-graphite p-6 md:p-8"
                >
                  <Icon size={22} className="mb-4 text-luxury-gold" />
                  <h3 className="mb-3 font-serif text-2xl text-luxury-ivory">
                    {t(`audiences.${key}.title`)}
                  </h3>
                  <p className="text-sm leading-relaxed text-luxury-muted-foreground md:text-base">
                    {t(`audiences.${key}.body`)}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="mb-20">
            <p className="eyebrow mb-4">{t("sectors.eyebrow")}</p>
            <h2 className="text-section-title mb-10 max-w-3xl">{t("sectors.title")}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {config.topics.map(({ key, icon: Icon }) => (
                <article
                  key={key}
                  className="border border-luxury-border bg-luxury-graphite p-6 transition-colors duration-200 hover:border-luxury-gold"
                >
                  <Icon size={20} className="mb-4 text-luxury-gold" />
                  <h3 className="mb-2 font-semibold text-luxury-ivory">
                    {t(`sectors.items.${key}.title`)}
                  </h3>
                  <p className="text-sm leading-relaxed text-luxury-muted-foreground">
                    {t(`sectors.items.${key}.body`)}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="mb-20">
            <p className="eyebrow mb-4">{t("process.eyebrow")}</p>
            <h2 className="text-section-title mb-10 max-w-3xl">{t("process.title")}</h2>
            <ol className="grid gap-0 border-y border-luxury-border md:grid-cols-4 md:divide-x md:divide-luxury-border">
              {config.steps.map((step, index) => (
                <li
                  key={step}
                  className="border-b border-luxury-border py-8 md:border-b-0 md:px-6 md:first:pl-0 md:last:pr-0"
                >
                  <span className="mb-4 inline-flex h-8 w-8 items-center justify-center border border-luxury-gold/40 text-sm font-semibold text-luxury-gold">
                    {index + 1}
                  </span>
                  <h3 className="mb-2 font-semibold text-luxury-ivory">
                    {t(`process.steps.${step}.title`)}
                  </h3>
                  <p className="text-sm leading-relaxed text-luxury-muted-foreground">
                    {t(`process.steps.${step}.body`)}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section className="mb-20 border border-luxury-gold/40 bg-luxury-gold/5 p-8 md:p-12">
            <p className="eyebrow mb-4">{t("coverage.eyebrow")}</p>
            <h2 className="text-section-title mb-4 max-w-3xl">{t("coverage.title")}</h2>
            <p className="max-w-3xl text-base leading-relaxed text-luxury-muted-foreground md:text-lg">
              {t("coverage.body")}
            </p>
          </section>

          <section className="border border-luxury-border bg-luxury-graphite p-8 md:p-12">
            <h2 className="text-section-title mb-4 max-w-2xl">{t("cta.title")}</h2>
            <p className="mb-8 max-w-2xl text-base leading-relaxed text-luxury-muted-foreground">
              {t("cta.body")}
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href={`/contact?focus=${config.focus}`}
                className="inline-flex items-center justify-center gap-2 bg-luxury-gold px-6 py-3 text-sm font-semibold text-luxury-black no-underline transition-all duration-200 hover:brightness-110"
              >
                {t("cta.button")}
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/book-a-call"
                className="inline-flex items-center justify-center gap-2 border border-luxury-gold px-6 py-3 text-sm font-semibold text-luxury-gold no-underline transition-colors duration-200 hover:bg-luxury-gold hover:text-luxury-black"
              >
                {t("cta.secondary")}
              </Link>
            </div>
          </section>
        </div>
      </article>
    </>
  );
}
