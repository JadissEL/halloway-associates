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

/** High-contrast matte palette — land must read clearly against ocean. */
export const MAP_COLORS = {
  ocean: "#f2eef7",
  land: "#c9bdd8",
  landActive: "#a894bc",
  landSelected: "#756088",
  stroke: "#2f2840",
  strokeLand: 0.42,
  strokeActive: 0.58,
  strokeSelected: 0.72,
  marker: "#8a7348",
  markerSelected: "#2f2840",
  markerRing: "#9a8555",
  markerOutline: "#ffffff",
  arc: "#6b5c38",
  arcGlow: "#3d3450",
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
