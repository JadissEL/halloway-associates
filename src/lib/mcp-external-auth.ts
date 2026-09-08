import { timingSafeEqual } from "crypto";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

// Generalizes the technique already used by src/lib/internal-auth.ts (shared
// secret header, timing-safe compare, reject known placeholder values) for
// the /api/mcp endpoint — but NOT the same function: internal-auth.ts is a
// single-caller, single-secret, "the caller *is* the authority" gate used by
// the modal/ admin app; this supports a named external client with its own
// (narrow, public-read-only) scopes, distinct from a signed-in platform
// user. v1 ships exactly one statically-configured external client — a real,
// working example of the pattern, not a full self-service registry — kept
// off by default: unset MCP_EXTERNAL_CLIENT_KEY means no external caller can
// ever authenticate, external exposure is opt-in, not on by default.
const HEADER = "x-mcp-client-key";

export function authorizeExternalMcpRequest(request: Request): AuthInfo | null {
  const expectedKey = process.env.MCP_EXTERNAL_CLIENT_KEY;
  const clientId = process.env.MCP_EXTERNAL_CLIENT_ID ?? "external-client";
  if (!expectedKey || expectedKey.startsWith("dev-only")) return null;

  const provided = request.headers.get(HEADER) ?? "";
  try {
    const a = Buffer.from(provided);
    const b = Buffer.from(expectedKey);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  // Deliberately narrow and public-only: no write scopes, no access to any
  // signed-in user's data (there is no signed-in user in this path — an
  // external client is never "acting as" a platform user in v1).
  return {
    token: clientId,
    clientId,
    scopes: ["properties:read", "professionals:read", "call-booking:read"],
    extra: { userId: null, email: null, role: null, locale: "en" },
  };
}
