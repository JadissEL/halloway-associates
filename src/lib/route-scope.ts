// Which routes still belong to the original "Studio" (Production Lab)
// product surface, as opposed to the new Greece marketplace shell. Used to
// keep Studio-only widgets (the legacy sales chatbot, its visitor tracker,
// the "Discuss with us" floating CTA) from leaking onto marketplace pages,
// where they duplicate/collide with the new AI concierge and are off-brand
// for a Greece-services context.
const STUDIO_PATH_PREFIXES = ["/studio", "/about", "/contact", "/services", "/work", "/insights"];

export function isStudioRoute(pathname: string): boolean {
  // Strip a leading locale segment if present (e.g. "/en/about" -> "/about").
  const withoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
  return STUDIO_PATH_PREFIXES.some(
    (prefix) => withoutLocale === prefix || withoutLocale.startsWith(`${prefix}/`),
  );
}
