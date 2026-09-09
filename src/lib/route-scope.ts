// Which routes still belong to the original "Studio" (Production Lab)
// product surface, as opposed to the new Greece marketplace shell. Used to
// keep the "Discuss with us" floating CTA (DiscussCTA) — a Studio-specific
// discovery-call conversion nudge, not a general-purpose widget — from
// leaking onto marketplace pages where it's off-brand for a Greece-services
// context.
const STUDIO_PATH_PREFIXES = ["/studio", "/about", "/contact", "/services", "/work", "/insights"];

export function isStudioRoute(pathname: string): boolean {
  // Strip a leading locale segment if present (e.g. "/en/about" -> "/about").
  const withoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
  return STUDIO_PATH_PREFIXES.some(
    (prefix) => withoutLocale === prefix || withoutLocale.startsWith(`${prefix}/`),
  );
}

// The one route where a second floating chat bubble would sit on top of (and
// on mobile, literally overlap) a chat surface that's already the entire
// page: the AI concierge's own 3-panel workspace. Every other route —
// Studio pages AND the new marketplace pages alike — gets the informational
// site assistant (SalesChatbot.tsx); this is the single exclusion.
const CONCIERGE_WORKSPACE_PREFIX = "/app";

export function isConciergeWorkspaceRoute(pathname: string): boolean {
  const withoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
  return withoutLocale === CONCIERGE_WORKSPACE_PREFIX || withoutLocale.startsWith(`${CONCIERGE_WORKSPACE_PREFIX}/`);
}
