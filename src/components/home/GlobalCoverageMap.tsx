"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { geoEqualEarth, geoInterpolate, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { Topology } from "topojson-specification";
import { useTranslations } from "next-intl";
import {
  activeCountryNames,
  GEO_URL,
  MAP_COLORS,
  MAP_CONFIG,
  MAP_STROKES,
  regionCountryNames,
} from "@/lib/map-config";
import { regions, type RegionId } from "@/lib/regions-data";
import { cn } from "@/lib/utils";

type CountryFeature = Feature<Geometry, { name: string }>;

type GlobalCoverageMapProps = {
  selectedId: RegionId;
  onSelect: (id: RegionId) => void;
};

export function GlobalCoverageMap({ selectedId, onSelect }: GlobalCoverageMapProps) {
  const t = useTranslations("regions");
  const reduceMotion = useReducedMotion();
  const [countries, setCountries] = useState<CountryFeature[]>([]);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadMap() {
      try {
        const response = await fetch(GEO_URL);
        if (!response.ok) throw new Error("Map data unavailable");
        const topology = (await response.json()) as Topology;
        const collection = feature(
          topology,
          topology.objects.countries as Parameters<typeof feature>[1],
        ) as FeatureCollection<Geometry, { name: string }>;
        if (!cancelled) {
          setCountries(collection.features);
          setLoadError(false);
        }
      } catch {
        if (!cancelled) setLoadError(true);
      }
    }

    void loadMap();
    return () => {
      cancelled = true;
    };
  }, []);

  const projection = useMemo(
    () =>
      geoEqualEarth()
        .scale(MAP_CONFIG.scale)
        .center(MAP_CONFIG.center)
        .translate([MAP_CONFIG.width / 2, MAP_CONFIG.height / 2]),
    [],
  );

  const pathGenerator = useMemo(() => geoPath(projection), [projection]);

  const selectedCountry = regionCountryNames[selectedId];
  const selectedRegion = regions.find((r) => r.id === selectedId)!;

  const networkArcs = useMemo(() => {
    const origin: [number, number] = [selectedRegion.longitude, selectedRegion.latitude];
    return regions
      .filter((r) => r.id !== selectedId)
      .map((target) => {
        const destination: [number, number] = [target.longitude, target.latitude];
        const interpolate = geoInterpolate(origin, destination);
        const coordinates = Array.from({ length: 64 }, (_, i) => interpolate(i / 63));
        return {
          id: target.id,
          d:
            pathGenerator({
              type: "LineString",
              coordinates,
            }) ?? "",
        };
      });
  }, [pathGenerator, selectedId, selectedRegion.latitude, selectedRegion.longitude]);

  const onMarkerKeyDown = useCallback(
    (event: React.KeyboardEvent, id: RegionId) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onSelect(id);
      }
    },
    [onSelect],
  );

  return (
    <div
      id="region-map-panel"
      role="tabpanel"
      aria-labelledby={`region-tab-${selectedId}`}
      className="overflow-hidden rounded-[24px] border border-line bg-surface"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/80 bg-surface/60 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
          {t("mapLegend")}
        </p>
        <div className="flex flex-wrap gap-4 text-xs text-ink-secondary">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-gold" aria-hidden />
            {t("legendMarket")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-8 rounded-full bg-gold/80" aria-hidden />
            {t("legendNetwork")}
          </span>
        </div>
      </div>

      <div className="relative w-full" style={{ aspectRatio: "2 / 1" }}>
        <svg
          viewBox={`0 0 ${MAP_CONFIG.width} ${MAP_CONFIG.height}`}
          className="h-full w-full"
          role="img"
          aria-label={t("mapAriaLabel")}
        >
          <rect width={MAP_CONFIG.width} height={MAP_CONFIG.height} fill={MAP_COLORS.ocean} />

          {loadError ? (
            <text
              x={MAP_CONFIG.width / 2}
              y={MAP_CONFIG.height / 2}
              textAnchor="middle"
              className="fill-ink-secondary text-sm"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {t("mapLoadError")}
            </text>
          ) : (
            <>
              <g>
                {countries.map((country) => {
                  const name = country.properties?.name ?? "";
                  const isActive = activeCountryNames.has(name);
                  const isSelected = name === selectedCountry;
                  const d = pathGenerator(country) ?? "";

                  const fill = isSelected
                    ? MAP_COLORS.landSelected
                    : isActive
                      ? MAP_COLORS.landActive
                      : MAP_COLORS.land;

                  const strokeOpacity = isSelected
                    ? MAP_COLORS.strokeSelected
                    : isActive
                      ? MAP_COLORS.strokeActive
                      : MAP_COLORS.strokeLand;

                  const strokeWidth = isSelected
                    ? MAP_STROKES.landSelected
                    : isActive
                      ? MAP_STROKES.landActive
                      : MAP_STROKES.land;

                  return (
                    <path
                      key={name || d.slice(0, 12)}
                      d={d}
                      fill={fill}
                      stroke={MAP_COLORS.stroke}
                      strokeWidth={strokeWidth}
                      strokeOpacity={strokeOpacity}
                      strokeLinejoin="round"
                      className="transition-[fill,stroke-opacity] duration-300"
                    />
                  );
                })}
              </g>

              <g fill="none" strokeLinecap="round" strokeLinejoin="round">
                {networkArcs.map((arc) => (
                  <g key={arc.id}>
                    <path
                      d={arc.d}
                      stroke={MAP_COLORS.arcGlow}
                      strokeOpacity={0.12}
                      strokeWidth={MAP_STROKES.arcGlow}
                    />
                    <path
                      d={arc.d}
                      stroke={MAP_COLORS.arc}
                      strokeOpacity={0.78}
                      strokeWidth={MAP_STROKES.arc}
                      strokeDasharray="7 5"
                    />
                  </g>
                ))}
              </g>

              {regions.map((region) => {
                const projected = projection([region.longitude, region.latitude]);
                if (!projected) return null;

                const [x, y] = projected;
                const isSelected = region.id === selectedId;

                return (
                  <g key={region.id}>
                    {!reduceMotion && isSelected && (
                      <motion.circle
                        cx={x}
                        cy={y}
                        r={20}
                        fill={MAP_COLORS.markerRing}
                        fillOpacity={0.22}
                        initial={{ scale: 0.85, opacity: 0.45 }}
                        animate={{ scale: 1.45, opacity: 0 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                      />
                    )}
                    <circle
                      cx={x}
                      cy={y}
                      r={MAP_STROKES.markerHalo}
                      fill={MAP_COLORS.markerRing}
                      fillOpacity={isSelected ? 0.35 : 0.2}
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r={MAP_STROKES.markerDot}
                      fill={isSelected ? MAP_COLORS.markerSelected : MAP_COLORS.marker}
                      stroke={MAP_COLORS.markerOutline}
                      strokeWidth={MAP_STROKES.markerOutline}
                      className="cursor-pointer"
                      role="button"
                      tabIndex={0}
                      aria-label={t(`${region.id}.mapLabel`)}
                      aria-pressed={isSelected}
                      onClick={() => onSelect(region.id)}
                      onKeyDown={(e) => onMarkerKeyDown(e, region.id)}
                    />
                    <text
                      x={x}
                      y={y - 15}
                      textAnchor="middle"
                      stroke={MAP_COLORS.markerOutline}
                      strokeWidth={4}
                      paintOrder="stroke"
                      className={cn(
                        "pointer-events-none select-none text-[11px] font-bold tracking-wide",
                        isSelected ? "fill-ink" : "fill-ink-secondary",
                      )}
                      style={{ fontFamily: "var(--font-sans)" }}
                    >
                      {t(`${region.id}.shortLabel`)}
                    </text>
                  </g>
                );
              })}
            </>
          )}
        </svg>
      </div>

      <p className="border-t border-line/80 bg-surface/60 px-4 py-3 text-xs leading-relaxed text-ink-muted">
        {t("mapFootnote")}
        {!loadError && (
          <span className="mt-1 block text-[11px] text-ink-faint">{t("mapAttribution")}</span>
        )}
      </p>
    </div>
  );
}
