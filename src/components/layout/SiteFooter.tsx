"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { isFeatureEnabled } from "@/lib/features";

export function SiteFooter() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const tMarketplace = useTranslations("marketplaceNav");
  const year = new Date().getFullYear();

  const exploreLinks = [
    { href: "/properties", label: tMarketplace("properties") },
    { href: "/professionals", label: tMarketplace("professionals") },
    { href: "/jobs", label: tMarketplace("jobs") },
    { href: "/services", label: tNav("services") },
  ] as const;

  const companyLinks = [
    { href: "/about", label: tNav("about") },
    { href: "/studio", label: tNav("studio") },
    ...(isFeatureEnabled("showWork") ? [{ href: "/work", label: t("ourWork") }] : []),
    { href: "/contact", label: t("contact") },
  ] as const;

  return (
    <footer className="border-t border-luxury-border bg-luxury-black">
      <div className="container-wide section-padding !py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="text-lg font-semibold tracking-tight text-luxury-ivory">
              Halloway & Associates
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-luxury-muted-foreground">{t("tagline")}</p>
          </div>
          <div>
            <p className="eyebrow">{t("exploreHeading")}</p>
            <ul className="mt-2 flex flex-col gap-2.5 text-sm">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="gold-link text-luxury-muted-foreground no-underline hover:text-luxury-ivory">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow">{t("companyHeading")}</p>
            <ul className="mt-2 flex flex-col gap-2.5 text-sm">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="gold-link text-luxury-muted-foreground no-underline hover:text-luxury-ivory">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-12 text-xs text-luxury-muted-foreground">{t("copyright", { year })}</p>
      </div>
    </footer>
  );
}
