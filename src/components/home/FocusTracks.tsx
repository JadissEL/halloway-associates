"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { focusTracks, type ServiceCategory } from "@/lib/services-data";
import { Link } from "@/i18n/navigation";
import { ArrowLink } from "@/components/icons/ArrowLink";

const trackStyles: Record<ServiceCategory, string> = {
  automation: "bg-lavender",
  revenue: "bg-warm",
  growth: "bg-lavender",
  product: "bg-warm",
};

export function FocusTracks() {
  const t = useTranslations("focusTracks");

  return (
    <section className="section-padding">
      <div className="container-wide">
        <div className="mb-14 max-w-2xl">
          <p className="eyebrow mb-4">{t("eyebrow")}</p>
          <h2 className="headline mb-4">{t("title")}</h2>
          <p className="subhead">{t("subtitle")}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {focusTracks.map((track, index) => (
            <motion.article
              key={track}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: index * 0.06, duration: 0.45 }}
              className={`rounded-[16px] p-8 md:p-10 ${trackStyles[track]}`}
            >
              <h3 className="mb-3 text-xl font-semibold tracking-tight text-ink">
                {t(`${track}.title`)}
              </h3>
              <p className="mb-6 text-ink-secondary">{t(`${track}.description`)}</p>
              <Link
                href={`/services?category=${track}`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink underline underline-offset-4"
              >
                {t("exploreLink")}
                <ArrowLink />
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
