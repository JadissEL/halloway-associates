import { getTranslations, setRequestLocale } from "next-intl/server";
import { PropertyForm } from "@/components/marketplace/PropertyForm";

type Props = { params: Promise<{ locale: string }> };

export default async function NewPropertyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("properties.form");

  return (
    <div className="min-h-screen bg-luxury-black px-4 py-10 md:px-10">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-8 font-serif text-3xl text-luxury-ivory">{t("title")}</h1>
        <PropertyForm />
      </div>
    </div>
  );
}
