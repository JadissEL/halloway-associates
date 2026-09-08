"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function HeroProductionLab() {
  const t = useTranslations("hero");
  const reduceMotion = useReducedMotion();
  const gridPatternId = useId();

  return (
    <section className="relative overflow-hidden section-padding">
      <div className="container-wide relative">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          aria-hidden
        >
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id={gridPatternId} width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#3a3d40" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${gridPatternId})`} />
          </svg>
        </div>

        <div className="relative grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="eyebrow mb-4">{t("eyebrow")}</p>
            <h1 className="headline mb-6 max-w-2xl">{t("title")}</h1>
            <p className="subhead mb-10 max-w-xl">{t("subtitle")}</p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center bg-luxury-gold px-7 py-3.5 text-sm font-semibold text-luxury-black no-underline transition-all duration-200 hover:brightness-110"
              >
                {t("ctaPrimary")}
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center border border-luxury-gold px-7 py-3.5 text-sm font-semibold text-luxury-gold no-underline transition-colors duration-200 hover:bg-luxury-gold hover:text-luxury-black"
              >
                {t("ctaSecondary")}
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative aspect-[4/3] overflow-hidden border border-luxury-border bg-luxury-graphite"
          >
            <HeroCanvas reducedMotion={!!reduceMotion} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function HeroCanvas({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full" aria-hidden>
      <rect width="400" height="300" fill="#202325" />
      {[
        [80, 120, 200, 80],
        [200, 80, 320, 140],
        [120, 180, 280, 200],
        [280, 140, 340, 220],
      ].map(([x1, y1, x2, y2], i) => (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#8a8f96"
          strokeOpacity="0.25"
          strokeWidth="1"
        />
      ))}
      {[
        [80, 120],
        [200, 80],
        [320, 140],
        [120, 180],
        [280, 200],
        [340, 220],
      ].map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={i === 1 ? 10 : 7}
          fill={i === 1 ? "#d8aa5a" : "#8a8f96"}
          fillOpacity={i === 1 ? 0.9 : 0.4}
        >
          {!reducedMotion && (
            <animate
              attributeName="r"
              values={i === 1 ? "10;11;10" : "7;8;7"}
              dur={`${3 + i * 0.5}s`}
              repeatCount="indefinite"
            />
          )}
        </circle>
      ))}
    </svg>
  );
}
