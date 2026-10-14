import { services } from "@/lib/services-data";

export const INDEXABLE_STATIC_PATHS = [
  "",
  "/studio",
  "/services",
  "/about",
  "/contact",
  "/properties",
  "/staffing",
  "/business-setup",
  "/experts",
  "/book-a-call",
] as const;

export function allIndexablePaths(): string[] {
  const servicePaths = services.map((s) => `/services/${s.id}`);
  return [...INDEXABLE_STATIC_PATHS, ...servicePaths];
}
