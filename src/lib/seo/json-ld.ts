import { services, type ServiceId } from "@/lib/services-data";
import { SITE_EMAIL, SITE_NAME, SITE_URL, localePath } from "@/lib/seo/site";

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
  // Halloway is a Greek rentals, relocation, and staffing business based in
  // Athens. Street address, phone, and legal name stay omitted until they
  // are confirmed — do not invent them. LocalBusiness rich results want an
  // address; add `address` / `telephone` / `legalName` only once confirmed.
  return {
    "@context": "https://schema.org",
    "@type": ["RealEstateAgent", "LocalBusiness"],
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    email: SITE_EMAIL,
    logo: `${SITE_URL}/brand/logo-mark.png`,
    description:
      locale === "el"
        ? "Ενοικιάσεις και τοποθέτηση ενοικιαστών στην Αθήνα, υπηρεσίες μετεγκατάστασης στην Ελλάδα, οικιακές υπηρεσίες και στελέχωση προσωπικού."
        : locale === "fr"
          ? "Locations et placement de locataires à Athènes, installation en Grèce, services à domicile et recrutement en Grèce et en Europe."
          : "Athens rentals and tenant placement, relocation to Greece, home services and staffing in Greece and Europe.",
    areaServed: [
      { "@type": "City", name: "Athens" },
      { "@type": "Country", name: "Greece" },
    ],
    knowsLanguage: ["en", "el", "fr"],
    priceRange: "€€",
  };
}

export function websiteJsonLd(locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: locale === "el" ? "el-GR" : locale === "fr" ? "fr-FR" : "en-GR",
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
    areaServed: { "@type": "Country", name: "Greece" },
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
