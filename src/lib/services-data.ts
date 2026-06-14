import { regions as regionDefinitions } from "@/lib/regions-data";

export type ServiceCategory = "automation" | "revenue" | "growth" | "product";

export type ServiceId =
  | "ai-automation"
  | "ai-chatbots"
  | "payments"
  | "content-social"
  | "marketing-seo"
  | "web-mvp"
  | "data-crm"
  | "community"
  | "branding"
  | "consulting"
  | "startup-mvp"
  | "fundraising"
  | "training"
  | "revenue-engineering";

export type ServiceIconName =
  | "settings-2"
  | "bot"
  | "graduation-cap"
  | "credit-card"
  | "line-chart"
  | "compass"
  | "trending-up"
  | "users"
  | "sparkles"
  | "globe"
  | "database"
  | "boxes"
  | "presentation"
  | "share";

export interface ServiceDefinition {
  id: ServiceId;
  category: ServiceCategory;
  icon: ServiceIconName;
}

export const serviceCategories: ServiceCategory[] = [
  "automation",
  "revenue",
  "growth",
  "product",
];

export const services: ServiceDefinition[] = [
  { id: "ai-automation", category: "automation", icon: "settings-2" },
  { id: "ai-chatbots", category: "automation", icon: "bot" },
  { id: "training", category: "automation", icon: "graduation-cap" },
  { id: "payments", category: "revenue", icon: "credit-card" },
  { id: "revenue-engineering", category: "revenue", icon: "line-chart" },
  { id: "consulting", category: "revenue", icon: "compass" },
  { id: "content-social", category: "growth", icon: "share" },
  { id: "marketing-seo", category: "growth", icon: "trending-up" },
  { id: "community", category: "growth", icon: "users" },
  { id: "branding", category: "growth", icon: "sparkles" },
  { id: "web-mvp", category: "product", icon: "globe" },
  { id: "data-crm", category: "product", icon: "database" },
  { id: "startup-mvp", category: "product", icon: "boxes" },
  { id: "fundraising", category: "product", icon: "presentation" },
];

export function getService(id: ServiceId): ServiceDefinition {
  const service = services.find((s) => s.id === id);
  if (!service) throw new Error(`Unknown service: ${id}`);
  return service;
}

export function isServiceId(value: string): value is ServiceId {
  return services.some((s) => s.id === value);
}

export const focusTracks: ServiceCategory[] = [
  "automation",
  "revenue",
  "growth",
  "product",
];

export const regions = regionDefinitions;
export type { RegionId } from "@/lib/regions-data";

export const stats = [
  { id: "pillars", value: 14 },
  { id: "tracks", value: 4 },
  { id: "regions", value: 8 },
  { id: "mvpWeeks", value: 6, suffix: "" },
] as const;
