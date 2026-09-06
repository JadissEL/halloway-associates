import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Building2, Car, Store, Briefcase, Sofa, Wrench, Tag, Landmark, type LucideIcon } from "lucide-react";

type Props = { params: Promise<{ locale: string }> };

const OPTIONS: { key: string; label: string; href: string; ready: boolean; icon: LucideIcon }[] = [
  { key: "property", label: "Property", href: "/properties/new", ready: true, icon: Building2 },
  { key: "vehicle", label: "Vehicle", href: "/vehicles", ready: false, icon: Car },
  { key: "business", label: "Business", href: "/businesses", ready: false, icon: Store },
  { key: "job", label: "Job", href: "/jobs", ready: false, icon: Briefcase },
  { key: "furniture", label: "Furniture", href: "/explore", ready: false, icon: Sofa },
  { key: "service", label: "Service", href: "/explore", ready: false, icon: Wrench },
  { key: "offer", label: "Offer", href: "/deals", ready: false, icon: Tag },
  { key: "land", label: "Land", href: "/explore", ready: false, icon: Landmark },
];

export default async function PostPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("marketplaceNav");

  return (
    <div className="luxury-surface min-h-screen px-4 py-14 text-luxury-ivory md:px-10 md:py-20">
      <div className="mx-auto max-w-3xl">
        <span className="mb-3 block h-px w-8 bg-luxury-gold/60" />
        <h1 className="mb-2 font-serif text-4xl font-semibold tracking-tight md:text-5xl">{t("post")}</h1>
        <p className="mb-10 text-sm text-luxury-muted-foreground">What would you like to publish?</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {OPTIONS.map((opt) => (
            <Link
              key={opt.key}
              href={opt.href}
              className="group flex items-start gap-4 border border-luxury-border bg-luxury-graphite p-5 no-underline transition-colors duration-200 hover:border-luxury-gold"
            >
              <opt.icon size={22} className="mt-0.5 shrink-0 text-luxury-muted-foreground transition-colors duration-200 group-hover:text-luxury-gold" />
              <div>
                <p className="font-serif text-lg text-luxury-ivory transition-colors duration-200 group-hover:text-luxury-gold">
                  {opt.label}
                </p>
                {!opt.ready && <p className="mt-1 text-xs text-luxury-muted-foreground">Coming soon</p>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
