"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { services } from "@/lib/services-data";
import { Link } from "@/i18n/navigation";
import { ServiceIcon } from "@/components/icons/ServiceIcon";
import { ArrowLink } from "@/components/icons/ArrowLink";

export function ServicesPreview() {
  const t = useTranslations("servicesPreview");
  const tItems = useTranslations("servicesPage.items");
  const tSeo = useTranslations("seo");
  const preview = services.slice(0, 6);

  return (
    <section className="bg-page section-padding">
      <div className="container-wide">
        <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="eyebrow mb-4">{t("eyebrow")}</p>
            <h2 className="headline mb-4">{t("title")}</h2>
            <p className="subhead">{t("subtitle")}</p>
          </div>
          <Link
            href="/services"
            className="inline-flex shrink-0 items-center rounded-full border border-line bg-surface px-6 py-3 text-sm font-semibold text-ink no-underline hover:bg-lavender/30"
          >
            {t("viewAll")}
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {preview.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.04 }}
            >
              <Link
                href={`/services/${service.id}`}
                className="group block rounded-[16px] border border-line bg-surface p-6 no-underline transition-colors hover:border-plum/20"
              >
                <ServiceIcon name={service.icon} />
                <h3 className="mb-2 font-semibold text-ink group-hover:text-plum">
                  {tItems(`${service.id}.title`)}
                </h3>
                <p className="text-sm leading-relaxed text-ink-secondary">
                  {tItems(`${service.id}.summary`)}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-secondary group-hover:text-ink">
                  {tSeo("learnMore")}
                  <ArrowLink className="h-3.5 w-3.5" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
