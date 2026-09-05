import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

type Props = { params: Promise<{ locale: string }> };

const CATEGORIES = [
  "properties", "professionals", "jobs", "vehicles", "businesses", "travel", "greece", "deals",
] as const;

export default async function ExplorePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("marketplaceNav");
  const tMarketplace = await getTranslations("marketplace");

  return (
    <div className="min-h-screen bg-luxury-black px-4 py-10 text-luxury-ivory md:px-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 font-serif text-3xl">{tMarketplace("exploreTitle")}</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/${cat}`}
              className="rounded-none border border-luxury-border p-6 no-underline hover:border-luxury-gold"
            >
              <p className="font-serif text-lg text-luxury-ivory">{t(cat)}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
