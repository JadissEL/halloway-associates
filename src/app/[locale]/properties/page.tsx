import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db/client";
import { safeQuery } from "@/lib/db/safe-query";
import { ServiceUnavailableNotice } from "@/components/marketplace/ServiceUnavailableNotice";
import type { PropertyType, ListingIntent } from "@prisma/client";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ city?: string; maxPrice?: string; type?: string; intent?: string }>;
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
    <div className="min-h-screen bg-luxury-black px-4 py-10 text-luxury-ivory md:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            {dbError && <ServiceUnavailableNotice />}
            <h1 className="font-serif text-3xl">{t("title")}</h1>
          </div>
          <Link
            href="/properties/new"
            className="rounded-none border border-luxury-gold px-4 py-2 text-sm font-semibold text-luxury-gold no-underline"
          >
            {t("postListing")}
          </Link>
        </div>

        <form className="mb-8 flex flex-wrap gap-3" method="get">
          <input
            name="city"
            defaultValue={sp.city}
            placeholder={t("searchPlaceholder")}
            className="rounded-none border border-luxury-border bg-luxury-graphite px-4 py-2.5 text-sm text-luxury-ivory outline-none focus:border-luxury-gold"
          />
          <input
            name="maxPrice"
            defaultValue={sp.maxPrice}
            type="number"
            placeholder={t("filters.priceMax")}
            className="w-36 rounded-none border border-luxury-border bg-luxury-graphite px-4 py-2.5 text-sm text-luxury-ivory outline-none focus:border-luxury-gold"
          />
          <select
            name="intent"
            defaultValue={sp.intent}
            className="rounded-none border border-luxury-border bg-luxury-graphite px-4 py-2.5 text-sm text-luxury-ivory outline-none focus:border-luxury-gold"
          >
            <option value="">{t("filters.intent")}</option>
            <option value="RENT">{t("intents.RENT")}</option>
            <option value="SALE">{t("intents.SALE")}</option>
          </select>
          <button
            type="submit"
            className="rounded-none bg-luxury-gold px-5 py-2.5 text-sm font-semibold text-luxury-black"
          >
            {t("title")}
          </button>
        </form>

        {properties.length === 0 ? (
          <p className="text-sm text-luxury-muted-foreground">{t("noResults")}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => (
              <div key={p.id} className="rounded-none border border-luxury-border p-4">
                {p.isDemo && (
                  <span className="mb-2 inline-block bg-luxury-gold px-2 py-0.5 text-[10px] font-bold uppercase text-luxury-black">
                    demo
                  </span>
                )}
                <p className="font-serif text-lg">{p.title}</p>
                <p className="text-sm text-luxury-muted-foreground">
                  {p.city}{p.area ? `, ${p.area}` : ""}
                </p>
                <p className="mt-2 text-sm font-semibold text-luxury-gold">
                  {p.priceAmount} {p.currency}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
