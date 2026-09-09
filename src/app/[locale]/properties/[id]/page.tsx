import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db/client";
import { safeQuery } from "@/lib/db/safe-query";
import { ServiceUnavailableNotice } from "@/components/marketplace/ServiceUnavailableNotice";
import { MediaTile } from "@/components/marketplace/MediaTile";
import { Badge } from "@/components/ui/Badge";
import { formatPrice, formatSqm } from "@/lib/format";
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

        <MediaTile
          images={property.images}
          icon={Icon}
          label={property.title}
          iconSize={48}
          className="h-64 border border-luxury-border md:h-80"
        />

        <div className="mt-8">
          {property.isDemo && <Badge variant="gold" className="mb-3">demo</Badge>}
          <h1 className="text-section-title">{property.title}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-luxury-muted-foreground">
            <MapPin size={14} />
            {property.city}
            {property.area ? `, ${property.area}` : ""}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <span className="text-numeric border border-luxury-gold/40 px-3 py-1.5 text-sm font-semibold text-luxury-gold">
              {formatPrice(property.priceAmount, property.currency, locale)}
            </span>
            <span className="border border-luxury-border px-3 py-1.5 text-sm text-luxury-muted-foreground">
              {t(`types.${property.propertyType}`)}
            </span>
            {property.livingAreaSqm != null && (
              <span className="text-numeric border border-luxury-border px-3 py-1.5 text-sm text-luxury-muted-foreground">
                {formatSqm(property.livingAreaSqm, locale)}
              </span>
            )}
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
