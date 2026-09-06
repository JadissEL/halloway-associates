"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LockKeyhole } from "lucide-react";

// Browsing (search, ask the concierge, view listings) never requires an
// account. This only appears at the moment someone tries to actually DO
// something -- submit a request, post a listing, book a call -- which is
// exactly the boundary the product is meant to have.
export function GatedAction() {
  const t = useTranslations("landingPage.gatedAction");

  return (
    <div className="flex max-w-md flex-col items-start gap-3 border border-luxury-border bg-luxury-graphite p-6 text-luxury-ivory">
      <div className="flex h-10 w-10 items-center justify-center border border-luxury-gold/40">
        <LockKeyhole size={18} className="text-luxury-gold" />
      </div>
      <p className="font-serif text-lg">{t("title")}</p>
      <p className="text-sm leading-relaxed text-luxury-muted-foreground">{t("body")}</p>
      <Link
        href="/sign-in"
        className="mt-2 bg-luxury-azure px-5 py-2.5 text-sm font-semibold text-white no-underline transition-colors duration-200 hover:bg-luxury-azure-hover"
      >
        {t("cta")}
      </Link>
    </div>
  );
}
