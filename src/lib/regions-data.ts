export type RegionId =
  | "morocco"
  | "greece"
  | "spain"
  | "italy"
  | "uk"
  | "usa"
  | "canada"
  | "uae";

export type RegionKind = "market";

export interface RegionDefinition {
  id: RegionId;
  kind: RegionKind;
  /** WGS84 — capital / primary business city for map placement */
  latitude: number;
  longitude: number;
}

export const regions: RegionDefinition[] = [
  { id: "morocco", kind: "market", latitude: 33.5731, longitude: -7.5898 },
  { id: "greece", kind: "market", latitude: 37.9838, longitude: 23.7275 },
  { id: "spain", kind: "market", latitude: 40.4168, longitude: -3.7038 },
  { id: "italy", kind: "market", latitude: 41.9028, longitude: 12.4964 },
  { id: "uk", kind: "market", latitude: 51.5074, longitude: -0.1278 },
  { id: "usa", kind: "market", latitude: 40.7128, longitude: -74.006 },
  { id: "canada", kind: "market", latitude: 43.6532, longitude: -79.3832 },
  { id: "uae", kind: "market", latitude: 25.2048, longitude: 55.2708 },
];

export const defaultRegionId: RegionId = "morocco";

export function getRegion(id: RegionId): RegionDefinition {
  const region = regions.find((r) => r.id === id);
  if (!region) throw new Error(`Unknown region: ${id}`);
  return region;
}
