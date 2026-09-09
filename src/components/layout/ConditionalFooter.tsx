"use client";

import { usePathname } from "@/i18n/navigation";
import { isConciergeWorkspaceRoute } from "@/lib/route-scope";
import { SiteFooter } from "@/components/layout/SiteFooter";

// The AI concierge workspace (/app) is a fixed h-[calc(100vh-4rem)] 3-panel
// shell, not a normal scrolling page -- it was never meant to have a
// document footer below it. But SiteFooter rendered unconditionally in the
// root layout (a server component, so it can't read the current pathname
// itself), which meant the page's total height (header + exactly-100vh
// workspace + footer) was always taller than the viewport: confirmed live
// at a plain 1440x900 desktop size, document height 1225px vs 900px
// viewport, so the whole page could scroll and the footer sat right below
// the "immersive full-height" workspace, breaking the intended chrome.
export function ConditionalFooter() {
  const pathname = usePathname();
  if (isConciergeWorkspaceRoute(pathname)) return null;
  return <SiteFooter />;
}
