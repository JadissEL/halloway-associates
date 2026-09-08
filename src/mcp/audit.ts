import { prisma } from "@/lib/db/client";
import type { McpOutcome, McpResourceType } from "@prisma/client";
import type { PlatformIdentity } from "./types";

export interface McpAuditEntry {
  identity: PlatformIdentity;
  clientId: string;
  toolName: string;
  resourceType?: McpResourceType;
  resourceId?: string;
  inputArgs: unknown;
  authorized: boolean;
  confirmed?: boolean;
  outcome: McpOutcome;
  errorMessage?: string;
  latencyMs: number;
}

// Every MCP tool call writes exactly one row here — proposals (pending
// confirmation), denials, errors, and successes alike. This is deliberately
// separate from AiUsageLog (token/cost/layer accounting, which was confirmed
// this session to drop args/results and has no authorization/outcome field)
// — this table exists specifically to answer "who did what, to what, was it
// authorized, was it confirmed." A write failure here must never take down
// the tool call itself (an audit-logging outage shouldn't become a user-
// facing outage), so this is fire-and-forget with its own error handling.
export async function recordMcpCall(entry: McpAuditEntry): Promise<void> {
  try {
    await prisma.mcpAuditLog.create({
      data: {
        actorUserId: entry.identity.userId,
        actorRole: entry.identity.role,
        clientId: entry.clientId,
        toolName: entry.toolName,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        inputArgs: entry.inputArgs as object,
        authorized: entry.authorized,
        confirmed: entry.confirmed,
        outcome: entry.outcome,
        errorMessage: entry.errorMessage,
        latencyMs: entry.latencyMs,
      },
    });
  } catch (error) {
    console.error("[mcp-audit]", error);
  }
}
