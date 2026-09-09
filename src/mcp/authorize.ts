import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import type { Role, User } from "@prisma/client";
import { isRateLimited } from "@/lib/rate-limit";
import type { McpScope, PlatformIdentity } from "./types";

// Role → scopes. CUSTOMER is the default role every signed-up user gets
// (prisma/schema.prisma `User.role @default(CUSTOMER)`) — this is the first
// place anything in the codebase actually branches on `User.role`; it was
// present in the schema but dormant everywhere else (confirmed by audit).
// ADMINISTRATOR isn't granted anything extra here on purpose: the existing
// admin surface (moderation, AI usage) is the separate modal/ app gated by
// INTERNAL_ADMIN_API_KEY, not a role check — this MCP layer doesn't yet
// expose any admin-only tool, so there's nothing to grant it for.
//
// properties:write:own is granted to every role (not just PROPERTY_OWNER/
// AGENT) because the platform's own manual posting flow
// (properties/new/page.tsx) already lets ANY signed-in user post a
// property regardless of role — only auth is checked there, not role. The
// AI-assisted draft tools (mcp/tools/listings.ts) are a second path onto
// the exact same authorization boundary; scoping them narrower than the
// form they're meant to parallel would make the AI *more* restrictive than
// the UI it's supposed to augment, not an intentional distinction.
const ROLE_SCOPES: Record<Role, McpScope[]> = {
  CUSTOMER: ["lawyer-request:create", "request:read:own", "call-booking:create", "properties:write:own"],
  PROPERTY_OWNER: ["lawyer-request:create", "request:read:own", "call-booking:create", "properties:write:own"],
  AGENT: ["lawyer-request:create", "request:read:own", "call-booking:create", "properties:write:own"],
  BUSINESS: ["lawyer-request:create", "request:read:own", "call-booking:create", "properties:write:own"],
  PROFESSIONAL: ["lawyer-request:create", "request:read:own", "call-booking:create", "properties:write:own"],
  ADMINISTRATOR: ["lawyer-request:create", "request:read:own", "call-booking:create", "properties:write:own"],
};

// Granted to every caller, signed in or not — matches what's public on the
// site today (anyone can browse /properties and /professionals with no
// account).
const PUBLIC_SCOPES: McpScope[] = ["properties:read", "professionals:read", "call-booking:read"];

export function deriveScopes(role: Role | null): McpScope[] {
  if (!role) return PUBLIC_SCOPES;
  return [...PUBLIC_SCOPES, ...(ROLE_SCOPES[role] ?? [])];
}

export function identityFromUser(user: User | null, locale: string, sessionId: string | null = null): PlatformIdentity {
  return { userId: user?.id ?? null, email: user?.email ?? null, role: user?.role ?? null, locale, sessionId };
}

// AuthInfo is OAuth-shaped (token/clientId/scopes) by SDK design — there's no
// real OAuth token for the internal concierge (it rides the platform's own
// session cookie), so `token`/`clientId` here just label which transport
// this call came through. `extra` is the SDK's documented passthrough field;
// it's where the actual platform identity travels.
export function buildAuthInfo(identity: PlatformIdentity, clientId: string): AuthInfo {
  return {
    token: identity.userId ?? "anonymous",
    clientId,
    scopes: deriveScopes(identity.role),
    extra: { ...identity },
  };
}

export function hasScope(authInfo: AuthInfo | undefined, scope: McpScope): boolean {
  return authInfo?.scopes.includes(scope) ?? false;
}

export function identityFromAuthInfo(authInfo: AuthInfo | undefined): PlatformIdentity {
  const extra = authInfo?.extra as PlatformIdentity | undefined;
  return extra ?? { userId: null, email: null, role: null, locale: "en", sessionId: null };
}

// Per-model ownership field, matching the schema exactly (confirmed by
// audit): Property.ownerId is nullable (some listings have no individual
// owner), RequestRoom/CallBooking.userId are non-nullable, Professional has
// no ownership concept at all — a naive "always compare .userId" helper
// would be wrong for two of these four. Only RequestRoom is actively
// enforced today (get_request_status); the others are declared here so the
// next tool that needs an ownership check reuses this table instead of
// re-deriving it (spec: adding a capability shouldn't mean rebuilding the
// authorization model).
export const RESOURCE_OWNERSHIP = {
  Property: "ownerId",
  RequestRoom: "userId",
  CallBooking: "userId",
  Professional: null,
} as const;

export type OwnedModel = keyof typeof RESOURCE_OWNERSHIP;

export function authorizeOwnership(
  model: OwnedModel,
  resourceOwnerId: string | null,
  callerUserId: string | null,
): boolean {
  const field = RESOURCE_OWNERSHIP[model];
  if (field === null) return false; // no ownership concept — never authorize by ownership alone
  if (!callerUserId) return false;
  if (resourceOwnerId === null) return false; // e.g. an unowned demo/admin Property — no individual owner to match
  return resourceOwnerId === callerUserId;
}

// Per-tool-per-caller rate limit, layered on top of the endpoint-level limit
// already applied in the conversation route — a caller who's under the
// overall request limit could otherwise still hammer one expensive/mutating
// tool repeatedly.
export function isToolRateLimited(toolName: string, identity: PlatformIdentity, limit = 20, windowMs = 5 * 60 * 1000): boolean {
  const key = `mcp-tool:${toolName}:${identity.userId ?? "anon"}`;
  return isRateLimited(key, limit, windowMs);
}
