import { regionCountryNames } from "@/lib/map-config";
import { services, type ServiceId } from "@/lib/services-data";
import { SITE_EMAIL, SITE_NAME, SITE_URL, localePath } from "@/lib/seo/site";

const GLOBAL_MARKETS = Object.values(regionCountryNames);

export function serviceListJsonLd(
  locale: string,
  items: { id: string; name: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Production Lab Services",
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: localePath(locale, `/services/${item.id}`),
    })),
  };
}

export function organizationJsonLd(locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    email: SITE_EMAIL,
    description:
      locale === "fr"
        ? "Studio d'ingénierie IA, automatisation et croissance. Systèmes prêts pour la production."
        : "AI, automation, and growth engineering studio. Production-grade systems for ambitious companies.",
    areaServed: GLOBAL_MARKETS.map((name) => ({
      "@type": "Country",
      name,
    })),
    knowsLanguage: ["English", "French", "Arabic", "Spanish", "Italian", "Greek"],
    serviceType: [
      "AI Automation",
      "MVP Development",
      "Revenue Systems",
      "Growth Engineering",
    ],
  };
}

export function websiteJsonLd(locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: [locale === "fr" ? "fr-CA" : "en-CA"],
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function breadcrumbJsonLd(
  locale: string,
  items: { name: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: localePath(locale, item.path),
    })),
  };
}

export function serviceJsonLd(
  locale: string,
  serviceId: ServiceId,
  title: string,
  description: string,
) {
  const service = services.find((s) => s.id === serviceId);
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${localePath(locale, `/services/${serviceId}`)}#service`,
    name: title,
    description,
    provider: { "@id": `${SITE_URL}/#organization` },
    areaServed: GLOBAL_MARKETS.map((name) => ({ "@type": "Country", name })),
    serviceType: service?.category ?? "ProfessionalService",
    url: localePath(locale, `/services/${serviceId}`),
  };
}

export function contactPageJsonLd(locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": `${localePath(locale, "/contact")}#contact`,
    name: locale === "fr" ? "Contact" : "Contact",
    url: localePath(locale, "/contact"),
    mainEntity: { "@id": `${SITE_URL}/#organization` },
  };
}
