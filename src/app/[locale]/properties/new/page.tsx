import { getTranslations, setRequestLocale } from "next-intl/server";
import { PropertyForm } from "@/components/marketplace/PropertyForm";

type Props = { params: Promise<{ locale: string }> };

export default async function NewPropertyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("properties.form");

  return (
    <div className="luxury-surface min-h-screen px-4 py-14 md:px-10 md:py-20">
      <div className="mx-auto max-w-xl">
        <span className="mb-3 block h-px w-8 bg-luxury-gold/60" />
        <h1 className="mb-8 font-serif text-4xl font-semibold tracking-tight text-luxury-ivory md:text-5xl">{t("title")}</h1>
        <PropertyForm />
      </div>
    </div>
  );
}
