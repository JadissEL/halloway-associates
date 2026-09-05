"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useConversation } from "./ConversationContext";

const TAGS = [
  "rentRoom", "rentHouse", "buyProperty", "sellProperty",
  "findJob", "sellCar", "buyCar", "sellFurniture",
  "moveApartment", "renovate", "cleaning", "propertyManagement",
  "airbnbManagement", "findLawyer", "findAccountant", "findArchitect",
  "calculateTaxes", "calculatePropertyCosts", "currencyConverter",
  "travel", "businessForSale", "landForSale", "publishOffer",
] as const;

export function QuickAccessRow() {
  const t = useTranslations("shell.quickAccess");
  const { sendMessage } = useConversation();

  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-3" aria-label={t("seeEverything")}>
      {TAGS.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => sendMessage(t(tag))}
          className="shrink-0 whitespace-nowrap rounded-none border border-luxury-border px-3.5 py-2 text-xs font-medium text-luxury-ivory hover:border-luxury-gold hover:text-luxury-gold"
        >
          {t(tag)}
        </button>
      ))}
      <Link
        href="/explore"
        className="shrink-0 whitespace-nowrap rounded-none border border-luxury-gold px-3.5 py-2 text-xs font-semibold text-luxury-gold no-underline"
      >
        {t("seeEverything")}
      </Link>
    </div>
  );
}
