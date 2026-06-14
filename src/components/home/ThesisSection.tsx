import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function ThesisSection() {
  const t = useTranslations("thesis");

  return (
    <section className="section-padding">
      <div className="container-narrow text-center">
        <p className="eyebrow mb-4">{t("eyebrow")}</p>
        <h2 className="headline mb-6">{t("title")}</h2>
        <p className="subhead mx-auto max-w-3xl">{t("body")}</p>
      </div>
    </section>
  );
}

export function HomeCTA() {
  const t = useTranslations("cta");

  return (
    <section className="section-padding bg-ink text-white">
      <div className="container-narrow text-center">
        <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
          {t("title")}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/75">{t("subtitle")}</p>
        <Link
          href="/contact"
          className="mt-10 inline-flex rounded-full bg-surface px-8 py-3.5 text-sm font-semibold text-ink no-underline transition-opacity hover:opacity-90"
        >
          {t("button")}
        </Link>
      </div>
    </section>
  );
}
