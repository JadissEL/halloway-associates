import type { RegionId } from "@/lib/regions-data";

/** Natural Earth country names in world-atlas countries-110m.json */
export const regionCountryNames: Record<RegionId, string> = {
  morocco: "Morocco",
  greece: "Greece",
  spain: "Spain",
  italy: "Italy",
  uk: "United Kingdom",
  usa: "United States of America",
  canada: "Canada",
  uae: "United Arab Emirates",
};

export const activeCountryNames = new Set(Object.values(regionCountryNames));

/** Dark luxury palette — gold markers/arcs must read clearly against a near-black ocean. */
export const MAP_COLORS = {
  ocean: "#15171a",
  land: "#33363a",
  landActive: "#4a4530",
  landSelected: "#8a6f3a",
  stroke: "#4d5256",
  strokeLand: 0.4,
  strokeActive: 0.55,
  strokeSelected: 0.75,
  marker: "#8a6f3a",
  markerSelected: "#d8aa5a",
  markerRing: "#d8aa5a",
  markerOutline: "#15171a",
  arc: "#8a6f3a",
  arcGlow: "#d8aa5a",
} as const;

export const MAP_STROKES = {
  land: 0.55,
  landActive: 0.65,
  landSelected: 0.85,
  arcGlow: 2.8,
  arc: 1.75,
  markerOutline: 2.25,
  markerDot: 6,
  markerHalo: 13,
} as const;

export const MAP_CONFIG = {
  width: 960,
  height: 480,
  scale: 160,
  center: [10, 18] as [number, number],
} as const;

export const GEO_URL = "/geo/countries-110m.json";
