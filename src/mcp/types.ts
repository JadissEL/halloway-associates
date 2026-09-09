import type { Role } from "@prisma/client";

// The platform identity behind an MCP call, carried through AuthInfo.extra
// (the SDK's passthrough field) rather than trusted from the AI's claims —
// every tool handler re-derives this from the session/DB, never from
// arguments the model supplies.
export interface PlatformIdentity {
  userId: string | null;
  email: string | null;
  role: Role | null;
  // Not really "identity," but AuthInfo.extra is the one passthrough field
  // the SDK gives every tool handler, and the conversation's reply locale is
  // request-scoped context tools legitimately need (e.g. defaulting a
  // booking's preferredLanguage) — simpler to carry it here than invent a
  // second passthrough channel.
  locale: string;
  // The chat session's client-generated id (ConversationContext.tsx). Media
  // upload tools (listings.ts) use this to find "media the user already
  // dropped into this chat" — threaded from the request, never supplied by
  // the model itself, since trusting the model to pass the right session id
  // would let one conversation's tool calls reach into another's uploads.
  sessionId: string | null;
}

// Scope vocabulary for AuthInfo.scopes. Read scopes are granted to anyone
// (including anonymous callers); write scopes require sign-in; "own" scopes
// additionally require the resource-ownership check in authorize.ts.
export const MCP_SCOPES = [
  "properties:read",
  "properties:write:own",
  "professionals:read",
  "lawyer-request:create",
  "request:read:own",
  "call-booking:read",
  "call-booking:create",
] as const;
export type McpScope = (typeof MCP_SCOPES)[number];

export const MCP_CLIENT_INTERNAL = "internal-concierge";
