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
    path: "/jobs",
    title: el
      ? "Θέσεις εργασίας και στελέχωση στην Ελλάδα | Halloway & Associates"
      : "Jobs & Staffing in Greece | Halloway & Associates",
    description: el
      ? "Στελέχωση και θέσεις εργασίας στην Ελλάδα. Η κατηγορία ανοίγει σύντομα — πείτε στον concierge τι ρόλο χρειάζεστε."
      : "Staffing and jobs in Greece. This category is opening soon — tell the concierge what role you need.",
  });
}

export default async function JobsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("marketplaceNav");
  return <ComingSoon title={t("jobs")} />;
}
