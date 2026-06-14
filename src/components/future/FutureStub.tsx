import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

type Props = {
  params: Promise<{ locale: string }>;
  variant: "work" | "insights";
};

export async function FutureStub({ params, variant }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("futurePage");

  return (
    <div className="section-padding">
      <div className="container-narrow text-center">
        <p className="eyebrow mb-4">{t("eyebrow")}</p>
        <h1 className="headline mb-4">{t("title")}</h1>
        <p className="subhead mx-auto mb-10 max-w-xl">
          {variant === "work" ? t("work") : t("insights")}
        </p>
        <Link
          href="/"
          className="inline-flex rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white no-underline"
        >
          {t("backHome")}
        </Link>
      </div>
    </div>
  );
}
