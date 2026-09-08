import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db/client";
import { safeQuery } from "@/lib/db/safe-query";
import { ServiceUnavailableNotice } from "@/components/marketplace/ServiceUnavailableNotice";
import { BedDouble, Building2, Home, Landmark, Store, MapPin, type LucideIcon } from "lucide-react";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

const TYPE_ICONS: Record<string, LucideIcon> = {
  ROOM: BedDouble,
  APARTMENT: Building2,
  HOUSE: Home,
  LAND: Landmark,
  COMMERCIAL: Store,
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data: property } = await safeQuery(
    () => prisma.property.findFirst({ where: { id, status: "PUBLISHED" } }),
    null,
  );
  return { title: property ? `${property.title} | Halloway & Associates` : "Not found" };
}

export default async function PropertyDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("properties");

  const { data: property, error: dbError } = await safeQuery(
    // Only ever serve PUBLISHED listings here — a PENDING_REVIEW/REJECTED
    // property's id must not be browsable just by guessing/enumerating it.
    () => prisma.property.findFirst({ where: { id, status: "PUBLISHED" } }),
    null,
  );

  if (dbError) {
    return (
      <div className="luxury-surface min-h-screen px-4 py-14 text-luxury-ivory md:px-10 md:py-20">
        <div className="mx-auto max-w-3xl">
          <ServiceUnavailableNotice />
        </div>
      </div>
    );
  }

  if (!property) {
    notFound();
  }

  const Icon = TYPE_ICONS[property.propertyType] ?? Home;

  return (
    <div className="luxury-surface min-h-screen px-4 py-14 text-luxury-ivory md:px-10 md:py-20">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/properties"
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-luxury-muted-foreground no-underline hover:text-luxury-gold"
        >
          &larr; {t("title")}
        </Link>

        <div className="flex h-56 items-center justify-center border border-luxury-border bg-luxury-graphite">
          <Icon size={48} className="text-luxury-muted-foreground" />
        </div>

        <div className="mt-8">
          {property.isDemo && (
            <span className="mb-3 inline-block bg-luxury-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-luxury-black">
              demo
            </span>
          )}
          <h1 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">{property.title}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-luxury-muted-foreground">
            <MapPin size={14} />
            {property.city}
            {property.area ? `, ${property.area}` : ""}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <span className="border border-luxury-gold/40 px-3 py-1.5 text-sm font-semibold text-luxury-gold">
              {property.priceAmount} {property.currency}
            </span>
            <span className="border border-luxury-border px-3 py-1.5 text-sm text-luxury-muted-foreground">
              {t(`types.${property.propertyType}`)}
            </span>
            <span className="border border-luxury-border px-3 py-1.5 text-sm text-luxury-muted-foreground">
              {t(`intents.${property.listingIntent}`)}
            </span>
            {property.bedrooms != null && (
              <span className="border border-luxury-border px-3 py-1.5 text-sm text-luxury-muted-foreground">
                {t("filters.bedrooms")}: {property.bedrooms}
              </span>
            )}
            {property.furnished != null && (
              <span className="border border-luxury-border px-3 py-1.5 text-sm text-luxury-muted-foreground">
                {property.furnished ? t("detail.furnished") : t("detail.unfurnished")}
              </span>
            )}
          </div>

          <p className="mt-8 whitespace-pre-line text-base leading-relaxed text-luxury-muted-foreground">
            {property.description}
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/contact?focus=other"
              className="inline-flex bg-luxury-gold px-6 py-3 text-sm font-semibold text-luxury-black no-underline transition-all duration-200 hover:brightness-110"
            >
              {t("detail.askAboutListing")}
            </Link>
            <Link
              href="/properties"
              className="inline-flex border border-luxury-gold px-6 py-3 text-sm font-semibold text-luxury-gold no-underline transition-colors duration-200 hover:bg-luxury-gold hover:text-luxury-black"
            >
              {t("title")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
