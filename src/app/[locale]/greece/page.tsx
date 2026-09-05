import { getTranslations, setRequestLocale } from "next-intl/server";
import { ComingSoon } from "@/components/marketplace/ComingSoon";

type Props = { params: Promise<{ locale: string }> };

export default async function GreecePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("marketplaceNav");
  return <ComingSoon title={t("greece")} />;
}
