"use client";

import { motion, useInView } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRef } from "react";

const statKeys = ["pillars", "tracks", "regions", "mvpWeeks"] as const;

export function StatsBand() {
  const t = useTranslations("stats");
  const ref = useRef<HTMLDivElement>(null);
  useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="border-y border-luxury-border section-padding">
      <div className="container-wide">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statKeys.map((key, index) => (
            <StatCard
              key={key}
              value={t(`${key}.value`)}
              label={t(`${key}.label`)}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function StatCard({
  value,
  label,
  index,
}: {
  value: string;
  label: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      className="border border-luxury-gold/40 bg-luxury-gold/5 p-8 md:p-10"
    >
      <p className="text-4xl font-semibold tracking-tight text-luxury-ivory md:text-5xl">
        {value}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-luxury-muted-foreground md:text-base">{label}</p>
    </motion.div>
  );
}
