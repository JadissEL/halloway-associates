import { getTranslations, setRequestLocale } from "next-intl/server";
import { ComingSoon } from "@/components/marketplace/ComingSoon";

type Props = { params: Promise<{ locale: string }> };

export default async function BusinessesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("shell.quickAccess");
  return <ComingSoon title={t("businessForSale")} />;
}
