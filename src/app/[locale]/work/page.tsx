import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { isFeatureEnabled } from "@/lib/features";
import { FutureStub } from "@/components/future/FutureStub";
import { buildPageMetadata } from "@/lib/seo/metadata";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "futurePage" });

  return buildPageMetadata({
    locale,
    path: "/work",
    title: `${t("title")} | Halloway & Associates`,
    description: t("work"),
    noindex: true,
  });
}

export default async function WorkPage({ params }: Props) {
  if (!isFeatureEnabled("showWork")) {
    return <FutureStub params={params} variant="work" />;
  }
  notFound();
}
