"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { isFeatureEnabled } from "@/lib/features";

export function SiteFooter() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-luxury-border bg-luxury-black">
      <div className="container-wide section-padding !py-12">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-lg font-semibold tracking-tight text-luxury-ivory">
              Halloway & Associates
            </p>
            <p className="mt-2 text-sm text-luxury-muted-foreground">{t("tagline")}</p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {isFeatureEnabled("showWork") && (
              <Link href="/work" className="font-medium text-luxury-ivory no-underline hover:underline">
                {t("ourWork")}
              </Link>
            )}
            <Link href="/contact" className="font-medium text-luxury-ivory no-underline hover:underline">
              {t("contact")}
            </Link>
          </div>
        </div>
        <p className="mt-10 text-xs text-luxury-muted-foreground">{t("copyright", { year })}</p>
      </div>
    </footer>
  );
}
