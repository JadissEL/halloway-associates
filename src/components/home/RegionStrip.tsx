"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Globe2, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  defaultRegionId,
  getRegion,
  regions,
  type RegionId,
} from "@/lib/regions-data";
import { GlobalCoverageMap } from "@/components/home/GlobalCoverageMap";
import { cn } from "@/lib/utils";

export function RegionStrip() {
  const t = useTranslations("regions");
  const [selectedId, setSelectedId] = useState<RegionId>(defaultRegionId);

  return (
    <section className="section-padding" aria-labelledby="regions-heading">
      <div className="container-wide">
        <div className="mb-14 max-w-2xl">
          <p className="eyebrow mb-4">{t("eyebrow")}</p>
          <h2 id="regions-heading" className="headline mb-4">
            {t("title")}
          </h2>
          <p className="subhead">{t("subtitle")}</p>
        </div>

        <div className="space-y-6">
          <GlobalCoverageMap selectedId={selectedId} onSelect={setSelectedId} />
          <RegionChipSelector selectedId={selectedId} onSelect={setSelectedId} />
          <RegionDetailPanel regionId={selectedId} />
        </div>
      </div>
    </section>
  );
}

function RegionChipSelector({
  selectedId,
  onSelect,
}: {
  selectedId: RegionId;
  onSelect: (id: RegionId) => void;
}) {
  const t = useTranslations("regions");

  return (
    <div
      className="flex flex-wrap gap-2"
      role="tablist"
      aria-label={t("selectorLabel")}
    >
      {regions.map((region) => {
        const isSelected = selectedId === region.id;
        return (
          <button
            key={region.id}
            type="button"
            role="tab"
            id={`region-tab-${region.id}`}
            aria-selected={isSelected}
            aria-controls="region-map-panel"
            onClick={() => onSelect(region.id)}
            className={cn(
              "inline-flex items-center gap-2 border px-4 py-2 text-sm font-medium transition-colors duration-200",
              isSelected
                ? "border-luxury-gold bg-luxury-gold text-luxury-black"
                : "border-luxury-border bg-luxury-graphite text-luxury-muted-foreground hover:border-luxury-gold hover:text-luxury-ivory",
            )}
          >
            <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
            {t(`${region.id}.city`)}
          </button>
        );
      })}
    </div>
  );
}

function RegionDetailPanel({ regionId }: { regionId: RegionId }) {
  const t = useTranslations("regions");
  getRegion(regionId);

  return (
    <motion.div
      key={regionId}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="border border-luxury-border bg-luxury-graphite p-5 md:p-6"
      aria-live="polite"
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center border border-luxury-gold/40 text-luxury-gold">
          <Globe2 className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-luxury-gold">
            {t(`${regionId}.role`)}
          </p>
          <h3 className="text-lg font-semibold text-luxury-ivory">{t(`${regionId}.city`)}</h3>
        </div>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DetailItem label={t("detailCoverage")} value={t(`${regionId}.coverage`)} />
        <DetailItem label={t("detailDelivery")} value={t(`${regionId}.delivery`)} />
        <DetailItem label={t("detailTimezone")} value={t(`${regionId}.timezone`)} />
        <DetailItem label={t("detailLanguages")} value={t(`${regionId}.languages`)} />
      </dl>

      <p className="mt-4 text-sm leading-relaxed text-luxury-muted-foreground">
        {t(`${regionId}.note`)}
      </p>
    </motion.div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-luxury-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm leading-relaxed text-luxury-muted-foreground">{value}</dd>
    </div>
  );
}
