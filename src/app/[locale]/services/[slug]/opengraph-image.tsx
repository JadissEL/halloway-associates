import { getTranslations } from "next-intl/server";
import { getService, isServiceId } from "@/lib/services-data";
import { renderOgImage } from "@/lib/seo/og-image";

export const alt = "Halloway & Associates Service";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function ServiceOgImage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isServiceId(slug)) {
    return renderOgImage({
      eyebrow: "Production Lab",
      title: "Halloway & Associates",
      subtitle: "Production Lab",
    });
  }

  getService(slug);
  const t = await getTranslations({ locale, namespace: "servicesPage.items" });

  return renderOgImage({
    eyebrow: "Production Lab",
    title: t(`${slug}.title`),
    subtitle: t(`${slug}.summary`),
  });
}
