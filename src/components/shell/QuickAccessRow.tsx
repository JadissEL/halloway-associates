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

const TAGS: { key: string; icon: LucideIcon }[] = [
  { key: "rentRoom", icon: BedDouble },
  { key: "rentHouse", icon: Home },
  { key: "buyProperty", icon: Building2 },
  { key: "sellProperty", icon: Tag },
  { key: "findJob", icon: Briefcase },
  { key: "sellCar", icon: Car },
  { key: "buyCar", icon: Car },
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
  { key: "travel", icon: Plane },
  { key: "businessForSale", icon: Store },
  { key: "landForSale", icon: Landmark },
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
      {TAGS.map(({ key, icon: Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => sendMessage(t(key))}
          className="group flex shrink-0 items-center gap-2 whitespace-nowrap rounded-none border border-luxury-border bg-luxury-black px-3.5 py-2 text-xs font-medium text-luxury-ivory transition-colors duration-200 hover:border-luxury-gold hover:text-luxury-gold"
        >
          <Icon size={13} className="text-luxury-muted-foreground transition-colors duration-200 group-hover:text-luxury-gold" />
          {t(key)}
        </button>
      ))}
      <Link
        href="/explore"
        className="shrink-0 whitespace-nowrap border border-luxury-gold bg-luxury-gold/10 px-3.5 py-2 text-xs font-semibold text-luxury-gold no-underline transition-colors duration-200 hover:bg-luxury-gold hover:text-luxury-black"
      >
        {t("seeEverything")}
      </Link>
    </div>
  );
}
