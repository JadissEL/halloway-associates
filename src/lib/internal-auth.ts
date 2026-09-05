import { timingSafeEqual } from "crypto";

// Gates the internal API surface that only the modal/ admin app is allowed
// to call (moderation actions, AI usage summaries) — a shared secret header
// rather than a second copy of the Prisma schema living in modal/, so there
// is exactly one source of truth for this data (spec section 10).
export function isAuthorizedInternalRequest(request: Request): boolean {
  const expected = process.env.INTERNAL_ADMIN_API_KEY;
  if (!expected || expected === "dev-only-placeholder-change-me") return false;

  const provided = request.headers.get("x-internal-admin-key") ?? "";
  try {
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
