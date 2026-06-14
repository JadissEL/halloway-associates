import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function LocaleNotFound() {
  const t = await getTranslations("seo");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow mb-4">404</p>
      <h1 className="headline mb-4">{t("notFoundTitle")}</h1>
      <p className="subhead mb-8 max-w-md">{t("notFoundBody")}</p>
      <Link
        href="/"
        className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white no-underline"
      >
        {t("notFoundCta")}
      </Link>
    </div>
  );
}
