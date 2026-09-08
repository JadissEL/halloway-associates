import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { regions } from "@/lib/services-data";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "aboutPage" });

  return buildPageMetadata({
    locale,
    path: "/about",
    title: `${t("title")} | Halloway & Associates`,
    description: t("intro"),
    ogTitle: t("title"),
    keywords: [
      "about Halloway & Associates",
      "production lab",
      "AI automation studio",
      "global delivery",
    ],
  });
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("aboutPage");
  const tRegions = await getTranslations("regions");
  const tNav = await getTranslations("nav");
  const steps = ["discover", "design", "build", "scale"] as const;
  const principles = ["modularity", "production", "honesty"] as const;

  const breadcrumbs = [
    { name: tNav("home"), path: "" },
    { name: tNav("about"), path: "/about" },
  ];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(locale, breadcrumbs)} />
      <div className="luxury-surface min-h-screen section-padding text-luxury-ivory">
        <div className="container-wide">
          <Breadcrumbs
            items={[
              { label: tNav("home"), href: "/" },
              { label: tNav("about") },
            ]}
          />
          <header className="mb-16 max-w-3xl">
            <p className="eyebrow mb-4">{t("eyebrow")}</p>
            <h1 className="headline mb-6">{t("title")}</h1>
            <p className="subhead">{t("intro")}</p>
          </header>

          <section className="mb-20 border border-luxury-gold/40 bg-luxury-gold/5 p-8 md:p-12">
            <h2 className="headline mb-4">{t("mission.title")}</h2>
            <p className="max-w-3xl text-lg leading-relaxed text-luxury-muted-foreground">{t("mission.body")}</p>
          </section>

          <section className="mb-20">
            <p className="eyebrow mb-4">{t("methodology.eyebrow")}</p>
            <h2 className="headline mb-10">{t("methodology.title")}</h2>
            <ol className="grid gap-0 border-y border-luxury-border md:grid-cols-4 md:divide-x md:divide-luxury-border">
              {steps.map((step, index) => (
                <li key={step} className="border-b border-luxury-border py-8 md:border-b-0 md:px-6 md:first:pl-0">
                  <span className="mb-4 inline-flex h-8 w-8 items-center justify-center border border-luxury-gold/40 text-sm font-semibold text-luxury-gold">
                    {index + 1}
                  </span>
                  <h3 className="mb-2 font-semibold text-luxury-ivory">{t(`methodology.steps.${step}.title`)}</h3>
                  <p className="text-sm leading-relaxed text-luxury-muted-foreground">
                    {t(`methodology.steps.${step}.body`)}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section className="mb-20">
            <h2 className="headline mb-8">{t("principles.title")}</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {principles.map((item) => (
                <article
                  key={item}
                  className="border border-luxury-border bg-luxury-graphite p-6 transition-colors duration-200 hover:border-luxury-gold"
                >
                  <h3 className="mb-2 font-semibold text-luxury-ivory">{t(`principles.items.${item}.title`)}</h3>
                  <p className="text-sm leading-relaxed text-luxury-muted-foreground">
                    {t(`principles.items.${item}.body`)}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section>
            <h2 className="headline mb-3">{t("locations.title")}</h2>
            <p className="subhead mb-8">{t("locations.subtitle")}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {regions.map((region) => (
                <div key={region.id} className="border border-luxury-border bg-luxury-graphite p-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-luxury-gold">
                    {tRegions(`${region.id}.role`)}
                  </p>
                  <h3 className="mt-1 font-semibold text-luxury-ivory">{tRegions(`${region.id}.city`)}</h3>
                  <p className="mt-1 text-sm text-luxury-muted-foreground">{tRegions(`${region.id}.coverage`)}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
