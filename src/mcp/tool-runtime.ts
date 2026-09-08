import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { McpResourceType } from "@prisma/client";
import { hasScope, identityFromAuthInfo, isToolRateLimited } from "./authorize";
import { recordMcpCall } from "./audit";
import { createPendingAction } from "./pending-actions";
import { requiresConfirmation } from "./risk";
import type { McpScope, PlatformIdentity } from "./types";

function textResult(text: string, structuredContent?: Record<string, unknown>, isError = false): CallToolResult {
  return { content: [{ type: "text", text }], structuredContent, isError };
}

export interface ToolRunOptions<Args extends Record<string, unknown>> {
  toolName: string;
  args: Args;
  authInfo: AuthInfo | undefined;
  requiredScope: McpScope;
  resourceType?: McpResourceType;
  // Only needed for tools where risk.ts marks requiresConfirmation() true —
  // renders the "here's what I'm about to do" text shown before execution.
  summarize?: (args: Args) => string;
  // The real business logic. Returns the data to surface to the caller, and
  // optionally which specific resource was touched (for the audit row).
  // `object` rather than `Record<string, unknown>` here on purpose: tool
  // return shapes are named interfaces/unions (e.g. CallBookingError), which
  // TS doesn't structurally accept as Record<string, unknown> without an
  // index signature — the one cast into that shape happens at the SDK
  // boundary below, not scattered across every tool.
  execute: (args: Args, identity: PlatformIdentity) => Promise<{ data: object; resourceId?: string }>;
}

// Shared control flow for every MCP tool: scope check → rate limit →
// confirmation gate (propose, don't execute, unless args.confirm === true or
// the tool is LOW risk) → execute → audit. Every branch — including denials
// and errors — writes exactly one McpAuditLog row, and every branch is
// reached through the same server-side checks regardless of which transport
// (internal concierge vs external HTTP client) the call came through.
export async function runTool<Args extends Record<string, unknown>>(opts: ToolRunOptions<Args>): Promise<CallToolResult> {
  const start = Date.now();
  const identity = identityFromAuthInfo(opts.authInfo);
  const clientId = opts.authInfo?.clientId ?? "unknown";

  if (!hasScope(opts.authInfo, opts.requiredScope)) {
    await recordMcpCall({
      identity, clientId, toolName: opts.toolName, resourceType: opts.resourceType,
      inputArgs: opts.args, authorized: false, outcome: "DENIED",
      errorMessage: identity.userId ? "missing_scope" : "sign_in_required",
      latencyMs: Date.now() - start,
    });
    return textResult(
      identity.userId
        ? "You're not authorized to do that."
        : "Please sign in first (via the magic-link sign-in page), then ask again.",
      undefined,
      true,
    );
  }

  if (isToolRateLimited(opts.toolName, identity)) {
    return textResult("You've made a lot of requests — please slow down and try again shortly.", undefined, true);
  }

  const confirmed = opts.args.confirm === true;
  if (requiresConfirmation(opts.toolName) && !confirmed) {
    const summary = opts.summarize?.(opts.args) ?? `Proceed with ${opts.toolName}?`;
    const confirmationId = createPendingAction(opts.toolName, opts.args, identity.userId);
    await recordMcpCall({
      identity, clientId, toolName: opts.toolName, resourceType: opts.resourceType,
      inputArgs: opts.args, authorized: true, confirmed: false, outcome: "PENDING_CONFIRMATION",
      latencyMs: Date.now() - start,
    });
    return textResult(summary, { pendingConfirmation: { confirmationId, toolName: opts.toolName, summary } });
  }

  try {
    const { data, resourceId } = await opts.execute(opts.args, identity);
    await recordMcpCall({
      identity, clientId, toolName: opts.toolName, resourceType: opts.resourceType, resourceId,
      inputArgs: opts.args, authorized: true,
      confirmed: requiresConfirmation(opts.toolName) ? true : undefined,
      outcome: "SUCCESS", latencyMs: Date.now() - start,
    });
    return textResult(JSON.stringify(data), data as Record<string, unknown>);
  } catch (error) {
    // A single tool failing (e.g. a transient Neon hiccup) must not throw
    // uncaught through the MCP client's tool-call loop — that would abort
    // the whole model turn instead of degrading just this one tool.
    console.error(`[mcp:${opts.toolName}]`, error);
    await recordMcpCall({
      identity, clientId, toolName: opts.toolName, resourceType: opts.resourceType,
      inputArgs: opts.args, authorized: true, outcome: "ERROR",
      errorMessage: error instanceof Error ? error.message : String(error),
      latencyMs: Date.now() - start,
    });
    return textResult("This is temporarily unavailable — try again shortly.", undefined, true);
  }
}
