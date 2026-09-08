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
    <section className="section-padding bg-luxury-gold text-luxury-black">
      <div className="container-narrow text-center">
        <h2 className="text-balance font-serif text-3xl font-semibold tracking-tight text-luxury-black md:text-4xl">
          {t("title")}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-luxury-black/75">{t("subtitle")}</p>
        <Link
          href="/contact"
          className="mt-10 inline-flex bg-luxury-black px-8 py-3.5 text-sm font-semibold text-luxury-ivory no-underline transition-opacity hover:opacity-90"
        >
          {t("button")}
        </Link>
      </div>
    </section>
  );
}
