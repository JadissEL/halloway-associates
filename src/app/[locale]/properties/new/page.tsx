import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { PropertyForm } from "@/components/marketplace/PropertyForm";
import { GatedAction } from "@/components/marketplace/GatedAction";

type Props = { params: Promise<{ locale: string }> };

export default async function NewPropertyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("properties.form");
  const user = await getCurrentUser();

  return (
    <div className="luxury-surface min-h-screen px-4 py-14 md:px-10 md:py-20">
      <div className="mx-auto max-w-xl">
        <span className="mb-3 block h-px w-8 bg-luxury-gold/60" />
        <h1 className="text-page-title mb-8">{t("title")}</h1>
        {user ? <PropertyForm /> : <GatedAction />}
      </div>
    </div>
  );
}
