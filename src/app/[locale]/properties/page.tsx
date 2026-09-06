import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db/client";
import { safeQuery } from "@/lib/db/safe-query";
import { ServiceUnavailableNotice } from "@/components/marketplace/ServiceUnavailableNotice";
import { BedDouble, Building2, Home, Landmark, Store, MapPin, type LucideIcon } from "lucide-react";
import type { PropertyType, ListingIntent } from "@prisma/client";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ city?: string; maxPrice?: string; type?: string; intent?: string }>;
};

const TYPE_ICONS: Record<string, LucideIcon> = {
  ROOM: BedDouble,
  APARTMENT: Building2,
  HOUSE: Home,
  LAND: Landmark,
  COMMERCIAL: Store,
};

export default async function PropertiesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("properties");

  const { data: properties, error: dbError } = await safeQuery(
    () =>
      prisma.property.findMany({
        where: {
          status: "PUBLISHED",
          ...(sp.city ? { city: { equals: sp.city, mode: "insensitive" } } : {}),
          ...(sp.maxPrice ? { priceAmount: { lte: Number(sp.maxPrice) } } : {}),
          ...(sp.type ? { propertyType: sp.type as PropertyType } : {}),
          ...(sp.intent ? { listingIntent: sp.intent as ListingIntent } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
    [],
  );

  return (
    <div className="luxury-surface min-h-screen px-4 py-14 text-luxury-ivory md:px-10 md:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            {dbError && <ServiceUnavailableNotice />}
            <span className="mb-2 block h-px w-8 bg-luxury-gold/60" />
            <h1 className="font-serif text-4xl font-semibold tracking-tight md:text-5xl">{t("title")}</h1>
          </div>
          <Link
            href="/properties/new"
            className="border border-luxury-gold px-5 py-2.5 text-sm font-semibold text-luxury-gold no-underline transition-colors duration-200 hover:bg-luxury-gold hover:text-luxury-black"
          >
            {t("postListing")}
          </Link>
        </div>

        <form className="mb-10 flex flex-wrap gap-3 border-b border-luxury-border pb-10" method="get">
          <input
            name="city"
            defaultValue={sp.city}
            placeholder={t("searchPlaceholder")}
            className="rounded-none border border-luxury-border bg-luxury-input px-4 py-2.5 text-sm text-luxury-ivory outline-none transition-colors duration-200 focus:border-luxury-gold"
          />
          <input
            name="maxPrice"
            defaultValue={sp.maxPrice}
            type="number"
            placeholder={t("filters.priceMax")}
            className="w-36 rounded-none border border-luxury-border bg-luxury-input px-4 py-2.5 text-sm text-luxury-ivory outline-none transition-colors duration-200 focus:border-luxury-gold"
          />
          <select
            name="type"
            defaultValue={sp.type}
            className="rounded-none border border-luxury-border bg-luxury-input px-4 py-2.5 text-sm text-luxury-ivory outline-none transition-colors duration-200 focus:border-luxury-gold"
          >
            <option value="">{t("filters.type")}</option>
            {Object.keys(TYPE_ICONS).map((type) => (
              <option key={type} value={type}>
                {t(`types.${type}`)}
              </option>
            ))}
          </select>
          <select
            name="intent"
            defaultValue={sp.intent}
            className="rounded-none border border-luxury-border bg-luxury-input px-4 py-2.5 text-sm text-luxury-ivory outline-none transition-colors duration-200 focus:border-luxury-gold"
          >
            <option value="">{t("filters.intent")}</option>
            <option value="RENT">{t("intents.RENT")}</option>
            <option value="SALE">{t("intents.SALE")}</option>
          </select>
          <button
            type="submit"
            className="bg-luxury-gold px-5 py-2.5 text-sm font-semibold text-luxury-black shadow-[0_4px_16px_rgba(201,162,74,0.2)] transition-all duration-200 hover:brightness-110"
          >
            {t("title")}
          </button>
        </form>

        {properties.length === 0 ? (
          <p className="text-sm text-luxury-muted-foreground">{t("noResults")}</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => {
              const Icon = TYPE_ICONS[p.propertyType] ?? Home;
              return (
                <div
                  key={p.id}
                  className="group border border-luxury-border bg-luxury-graphite transition-colors duration-200 hover:border-luxury-gold"
                >
                  <div className="flex h-32 items-center justify-center border-b border-luxury-border bg-luxury-black/60">
                    <Icon size={32} className="text-luxury-muted-foreground transition-colors duration-200 group-hover:text-luxury-gold" />
                  </div>
                  <div className="p-4">
                    {p.isDemo && (
                      <span className="mb-2 inline-block bg-luxury-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-luxury-black">
                        demo
                      </span>
                    )}
                    <p className="font-serif text-lg transition-colors duration-200 group-hover:text-luxury-gold">{p.title}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-luxury-muted-foreground">
                      <MapPin size={13} />
                      {p.city}
                      {p.area ? `, ${p.area}` : ""}
                    </p>
                    <p className="mt-3 inline-block border border-luxury-gold/40 px-2.5 py-1 text-sm font-semibold text-luxury-gold">
                      {p.priceAmount} {p.currency}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
