import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Building2, Scale, Briefcase, Car, Store, Plane, MapPinned, Tag, type LucideIcon, ArrowRight } from "lucide-react";

type Props = { params: Promise<{ locale: string }> };

const CATEGORIES: { key: string; icon: LucideIcon }[] = [
  { key: "properties", icon: Building2 },
  { key: "professionals", icon: Scale },
  { key: "jobs", icon: Briefcase },
  { key: "vehicles", icon: Car },
  { key: "businesses", icon: Store },
  { key: "travel", icon: Plane },
  { key: "greece", icon: MapPinned },
  { key: "deals", icon: Tag },
];

export default async function ExplorePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("marketplaceNav");
  const tMarketplace = await getTranslations("marketplace");

  return (
    <div className="luxury-surface min-h-screen px-4 py-14 text-luxury-ivory md:px-10 md:py-20">
      <div className="mx-auto max-w-4xl">
        <span className="mb-3 block h-px w-8 bg-luxury-gold/60" />
        <h1 className="mb-10 font-serif text-4xl font-semibold tracking-tight md:text-5xl">{tMarketplace("exploreTitle")}</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map(({ key, icon: Icon }) => (
            <Link
              key={key}
              href={`/${key}`}
              className="group flex items-center justify-between border border-luxury-border bg-luxury-graphite p-6 no-underline transition-colors duration-200 hover:border-luxury-gold"
            >
              <div className="flex items-center gap-4">
                <Icon size={22} className="text-luxury-muted-foreground transition-colors duration-200 group-hover:text-luxury-gold" />
                <p className="font-serif text-lg text-luxury-ivory transition-colors duration-200 group-hover:text-luxury-gold">
                  {t(key)}
                </p>
              </div>
              <ArrowRight
                size={16}
                className="text-luxury-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-1 group-hover:text-luxury-gold group-hover:opacity-100"
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
