import { getTranslations } from "next-intl/server";
import { renderOgImage } from "@/lib/seo/og-image";

export const alt = "Halloway & Associates Services";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: Promise<{ locale: string }> };

export default async function ServicesOgImage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "servicesPage" });

  return renderOgImage({
    eyebrow: t("eyebrow"),
    title: t("title"),
    subtitle: t("subtitle"),
  });
}
