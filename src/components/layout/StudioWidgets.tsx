"use client";

import { usePathname } from "@/i18n/navigation";
import { isStudioRoute, isConciergeWorkspaceRoute } from "@/lib/route-scope";
import { SalesChatbot } from "@/components/chat/SalesChatbot";
import { VisitorTracker } from "@/lib/chat/visitor-client";
import { DiscussCTA } from "@/components/layout/DiscussCTA";

// Two independent scopes, not one:
// - SalesChatbot + VisitorTracker are now the platform's sitewide
//   informational assistant (spec: "cover all points of the website") —
//   shown everywhere EXCEPT the AI concierge's own workspace (/app), where a
//   second floating bubble would sit on top of a page that's already one big
//   chat surface. It knows about both the Greece marketplace and Halloway's
//   Studio/agency services, but never acts — see src/lib/chat/system-prompt.ts.
// - DiscussCTA is a Studio-specific discovery-call conversion bar and stays
//   scoped to Studio pages only; it isn't part of what the general assistant
//   replaced.
export function StudioWidgets() {
  const pathname = usePathname();

  return (
    <>
      {!isConciergeWorkspaceRoute(pathname) && (
        <>
          <SalesChatbot />
          <VisitorTracker />
        </>
      )}
      {isStudioRoute(pathname) && <DiscussCTA />}
    </>
  );
}
