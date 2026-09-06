"use client";

import { usePathname } from "@/i18n/navigation";
import { isStudioRoute } from "@/lib/route-scope";
import { SalesChatbot } from "@/components/chat/SalesChatbot";
import { VisitorTracker } from "@/lib/chat/visitor-client";
import { DiscussCTA } from "@/components/layout/DiscussCTA";

// The legacy Studio sales-advisor chatbot, its visitor tracker, and the
// floating "Discuss with us" CTA only make sense on the original Production
// Lab pages -- rendering them globally meant a second, unrelated chat bubble
// sat on top of (and on mobile, literally overlapped) the new AI concierge's
// own input on every marketplace page.
export function StudioWidgets() {
  const pathname = usePathname();
  if (!isStudioRoute(pathname)) return null;

  return (
    <>
      <SalesChatbot />
      <VisitorTracker />
      <DiscussCTA />
    </>
  );
}
