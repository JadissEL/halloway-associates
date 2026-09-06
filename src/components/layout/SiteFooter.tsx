"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { isFeatureEnabled } from "@/lib/features";
import { isStudioRoute } from "@/lib/route-scope";
import { cn } from "@/lib/utils";

export function SiteFooter() {
  const t = useTranslations("footer");
  const pathname = usePathname();
  const dark = !isStudioRoute(pathname);
  const year = new Date().getFullYear();

  return (
    <footer className={cn("border-t", dark ? "border-luxury-border bg-luxury-black" : "border-line bg-page")}>
      <div className="container-wide section-padding !py-12">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr]">
          <div>
            <p className={cn("text-lg font-semibold tracking-tight", dark ? "text-luxury-ivory" : "text-ink")}>
              Halloway & Associates
            </p>
            <p className={cn("mt-2 text-sm", dark ? "text-luxury-muted-foreground" : "text-ink-muted")}>{t("tagline")}</p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {isFeatureEnabled("showWork") && (
              <Link
                href="/work"
                className={cn("font-medium no-underline hover:underline", dark ? "text-luxury-ivory" : "text-ink")}
              >
                {t("ourWork")}
              </Link>
            )}
            <Link
              href="/contact"
              className={cn("font-medium no-underline hover:underline", dark ? "text-luxury-ivory" : "text-ink")}
            >
              {t("contact")}
            </Link>
          </div>
        </div>
        <p className={cn("mt-10 text-xs", dark ? "text-luxury-muted-foreground" : "text-ink-faint")}>
          {t("copyright", { year })}
        </p>
      </div>
    </footer>
  );
}
