"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useConversation } from "./ConversationContext";
import {
  BedDouble, Home, Building2, Tag, Briefcase, Car, Sofa, Truck,
  Wrench, Sparkles, Building, CalendarCheck, Scale, Calculator,
  Compass, Coins, PiggyBank, Globe2, Plane, Store, Landmark, Megaphone,
  type LucideIcon,
} from "lucide-react";

// `href` is set only for categories with zero AI-tool/data backing today
// (no Job/Vehicle/Travel/Business model, per src/lib/ai/tools.ts) — those
// chips go straight to the platform's own honest "coming soon" page (or, for
// land, the real property-posting form — land is a real PropertyType) instead
// of opening a chat the concierge has no way to actually fulfill. Every chip
// without `href` maps to a category the concierge DOES have a real tool for
// (search_properties / find_professionals / etc.) and stays a chat prompt.
const TAGS: { key: string; icon: LucideIcon; href?: string }[] = [
  { key: "rentRoom", icon: BedDouble },
  { key: "rentHouse", icon: Home },
  { key: "buyProperty", icon: Building2 },
  { key: "sellProperty", icon: Tag },
  { key: "findJob", icon: Briefcase, href: "/jobs" },
  { key: "sellCar", icon: Car, href: "/vehicles" },
  { key: "buyCar", icon: Car, href: "/vehicles" },
  { key: "sellFurniture", icon: Sofa },
  { key: "moveApartment", icon: Truck },
  { key: "renovate", icon: Wrench },
  { key: "cleaning", icon: Sparkles },
  { key: "propertyManagement", icon: Building },
  { key: "airbnbManagement", icon: CalendarCheck },
  { key: "findLawyer", icon: Scale },
  { key: "findAccountant", icon: Calculator },
  { key: "findArchitect", icon: Compass },
  { key: "calculateTaxes", icon: Coins },
  { key: "calculatePropertyCosts", icon: PiggyBank },
  { key: "currencyConverter", icon: Globe2 },
  { key: "travel", icon: Plane, href: "/travel" },
  { key: "businessForSale", icon: Store, href: "/businesses" },
  { key: "landForSale", icon: Landmark, href: "/properties?type=LAND" },
  { key: "publishOffer", icon: Megaphone },
];

export function QuickAccessRow() {
  const t = useTranslations("shell.quickAccess");
  const { sendMessage } = useConversation();

  return (
    <div
      className="scrollbar-none flex gap-2 overflow-x-auto px-4 py-3 md:px-8"
      style={{ scrollbarWidth: "none" }}
      aria-label={t("seeEverything")}
    >
      {TAGS.map(({ key, icon: Icon, href }) => {
        const className =
          "group flex shrink-0 items-center gap-2 whitespace-nowrap rounded-none border border-luxury-border bg-luxury-black px-3.5 py-2 text-xs font-medium text-luxury-ivory no-underline transition-colors duration-200 hover:border-luxury-gold hover:text-luxury-gold";
        const content = (
          <>
            <Icon size={13} className="text-luxury-muted-foreground transition-colors duration-200 group-hover:text-luxury-gold" />
            {t(key)}
          </>
        );
        return href ? (
          <Link key={key} href={href} className={className}>
            {content}
          </Link>
        ) : (
          <button key={key} type="button" onClick={() => sendMessage(t(key))} className={className}>
            {content}
          </button>
        );
      })}
      <Link
        href="/explore"
        className="shrink-0 whitespace-nowrap border border-luxury-gold bg-luxury-gold/10 px-3.5 py-2 text-xs font-semibold text-luxury-gold no-underline transition-colors duration-200 hover:bg-luxury-gold hover:text-luxury-black"
      >
        {t("seeEverything")}
      </Link>
    </div>
  );
}
