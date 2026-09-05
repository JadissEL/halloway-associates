import { getTranslations, setRequestLocale } from "next-intl/server";
import { LawyerRequestForm } from "@/components/marketplace/LawyerRequestForm";

type Props = { params: Promise<{ locale: string }> };

export default async function LawyerRequestPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("lawyerRequest");

  return (
    <div className="min-h-screen bg-luxury-black px-4 py-10 md:px-10">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-8 font-serif text-3xl text-luxury-ivory">{t("title")}</h1>
        <LawyerRequestForm />
      </div>
    </div>
  );
}
