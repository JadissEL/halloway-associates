import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ComingSoon } from "@/components/marketplace/ComingSoon";
import { buildPageMetadata } from "@/lib/seo/metadata";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const el = locale === "el";
  return buildPageMetadata({
    locale,
    path: "/greece",
    title: el
      ? "Μετεγκατάσταση στην Ελλάδα | Halloway & Associates"
      : "Relocation to Greece | Halloway & Associates",
    description: el
      ? "Υποστήριξη μετεγκατάστασης στην Ελλάδα: προσανατολισμός, στέγαση και τοπική εγκατάσταση με την Halloway & Associates στην Αθήνα."
      : "Relocation support for moving to Greece: orientation, housing, and local setup with Halloway & Associates in Athens.",
  });
}

export default async function GreecePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("marketplaceNav");
  return <ComingSoon title={t("greece")} />;
}
