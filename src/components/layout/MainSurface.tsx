"use client";

import { usePathname } from "@/i18n/navigation";
import { isStudioRoute } from "@/lib/route-scope";
import { cn } from "@/lib/utils";

// Route-aware wrapper around <main>, mirroring the same isStudioRoute split
// SiteHeader/SiteFooter already use — gives every Studio page the quiet
// atmospheric wash (.studio-surface) without touching each page individually,
// and does nothing on marketplace routes (those apply .luxury-surface
// themselves, per-page, since not every marketplace page wants it e.g. the
// account/sign-in shells).
export function MainSurface({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const studio = isStudioRoute(pathname);

  return (
    <main id="main-content" className={cn(studio && "studio-surface min-h-screen")}>
      {children}
    </main>
  );
}
