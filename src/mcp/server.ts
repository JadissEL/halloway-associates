import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { registerPropertyTools } from "./tools/properties";
import { registerProfessionalTools } from "./tools/professionals";
import { registerRequestTools } from "./tools/requests";
import { registerCallTools } from "./tools/calls";
import { registerListingTools } from "./tools/listings";
import type { McpScope } from "./types";

// One real capability registry (same tool definitions, same authorization
// path in tool-runtime.ts, same audit trail) shared by every transport —
// but NOT one shared server *instance*. The SDK's own Protocol.connect()
// throws on a second connect ("Already connected to a transport... use a
// separate Protocol instance per connection") — a Next.js route handles
// concurrent requests on one process, so a memoized singleton here would
// throw (or worse, cross-talk between two callers' authInfo) under any real
// concurrent load. Registering 7 tools is synchronous, no I/O — creating a
// fresh server per connection (per external HTTP request, per internal
// conversation turn) is the correct, cheap, SDK-documented pattern, not a
// singleton with a global cache.
//
// authInfo is optional and, when given, drives which tools actually get
// registered — not just which ones a handler will *allow executing*
// (tool-runtime.ts's per-call check is the real security boundary and
// always runs regardless). Without this, tools/list handed every caller the
// full 7-tool catalog including ones they have no scope for — harmless
// security-wise (the call-time check still denies them) but exactly the
// "don't expose tools blindly" hygiene problem a real capability-discovery
// layer is supposed to avoid. Because each request gets a fresh server
// (never a shared singleton), skipping registration per-caller here is
// safe — there's no cross-request state to corrupt.
export function createMcpServer(authInfo?: AuthInfo): McpServer {
  const server = new McpServer({ name: "halloway-platform", version: "1.0.0" });
  const visibleScopes: Set<McpScope> | null = authInfo ? new Set(authInfo.scopes as McpScope[]) : null;
  registerPropertyTools(server, visibleScopes);
  registerProfessionalTools(server, visibleScopes);
  registerRequestTools(server, visibleScopes);
  registerCallTools(server, visibleScopes);
  registerListingTools(server, visibleScopes);
  return server;
}
