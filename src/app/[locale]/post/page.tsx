import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

type Props = { params: Promise<{ locale: string }> };

const OPTIONS: { key: string; label: string; href: string; ready: boolean }[] = [
  { key: "property", label: "Property", href: "/properties/new", ready: true },
  { key: "vehicle", label: "Vehicle", href: "/vehicles", ready: false },
  { key: "business", label: "Business", href: "/businesses", ready: false },
  { key: "job", label: "Job", href: "/jobs", ready: false },
  { key: "furniture", label: "Furniture", href: "/explore", ready: false },
  { key: "service", label: "Service", href: "/explore", ready: false },
  { key: "offer", label: "Offer", href: "/deals", ready: false },
  { key: "land", label: "Land", href: "/explore", ready: false },
];

export default async function PostPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("marketplaceNav");

  return (
    <div className="min-h-screen bg-luxury-black px-4 py-10 text-luxury-ivory md:px-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 font-serif text-3xl">{t("post")}</h1>
        <p className="mb-8 text-sm text-luxury-muted-foreground">What would you like to publish?</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {OPTIONS.map((opt) => (
            <Link
              key={opt.key}
              href={opt.href}
              className="rounded-none border border-luxury-border p-5 no-underline hover:border-luxury-gold"
            >
              <p className="font-serif text-lg text-luxury-ivory">{opt.label}</p>
              {!opt.ready && <p className="mt-1 text-xs text-luxury-muted-foreground">Coming soon</p>}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
