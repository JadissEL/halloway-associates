// Validates a client-supplied "redirect back here after sign-in" path
// (threaded through /sign-in?redirect=... -> the magic-link email -> the
// verify route) so it can never become an open redirect: must be a plain
// same-origin path, not a protocol-relative ("//evil.com") or
// backslash-tricked ("/\evil.com") URL that a browser would resolve to a
// different host.
export function safeRedirectPath(path: string | null | undefined, fallback = "/account"): string {
  if (!path || typeof path !== "string") return fallback;
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return fallback;
  return path;
}
