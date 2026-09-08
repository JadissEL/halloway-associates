import Groq from "groq-sdk";
import { connectInternalMcpClient } from "@/mcp/internal-client";
import { buildAuthInfo, hasScope } from "@/mcp/authorize";
import { consumePendingAction } from "@/mcp/pending-actions";
import { MCP_CLIENT_INTERNAL, type McpScope, type PlatformIdentity } from "@/mcp/types";

export interface ConciergeMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ConciergePendingConfirmation {
  confirmationId: string;
  toolName: string;
  summary: string;
}

export interface ConciergeRunResult {
  reply: string;
  toolCalls: { name: string; args: string; result: object }[];
  usage: { promptTokens: number; completionTokens: number };
  model: string;
  pendingConfirmation: ConciergePendingConfirmation | null;
}

const MAX_TOOL_ROUNDS = 4;

/**
 * Layer 4 — the AI concierge as a genuine MCP client. It connects to the
 * platform's real McpServer (src/mcp/server.ts) over an in-process
 * transport, discovers only the tools its caller's identity/scopes actually
 * allow (item 18: no blind full tool list), and calls them through the
 * exact same authorization → confirmation-gate → business-logic → audit
 * path an external MCP client would go through (src/app/api/mcp/route.ts).
 * There is no direct-function-call shortcut left — this used to import
 * `executeTool` from `src/lib/ai/tools.ts` directly; that file is retired.
 */
export async function runConcierge(
  systemPrompt: string,
  history: ConciergeMessage[],
  identity: PlatformIdentity,
): Promise<ConciergeRunResult> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured.");
  }
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const model = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";

  const authInfo = buildAuthInfo(identity, MCP_CLIENT_INTERNAL);
  const mcp = await connectInternalMcpClient(authInfo);

  try {
    const { tools: allTools } = await mcp.client.listTools();
    // Client-side filtering by the same scopes the server will re-check on
    // every call anyway (defense in depth, not the security boundary) —
    // this is what keeps the model from even seeing a tool it can't use,
    // rather than relying purely on a runtime denial after the fact.
    const visibleTools = allTools.filter((tool) => {
      const requiredScope = (tool._meta as Record<string, unknown> | undefined)?.requiredScope as McpScope | undefined;
      return !requiredScope || hasScope(authInfo, requiredScope);
    });

    const groqTools = visibleTools.map((tool) => ({
      type: "function" as const,
      function: {
        name: tool.name,
        description: tool.description ?? "",
        parameters: tool.inputSchema,
      },
    }));

    const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ];

    const allToolCalls: ConciergeRunResult["toolCalls"] = [];
    let pendingConfirmation: ConciergePendingConfirmation | null = null;
    let promptTokens = 0;
    let completionTokens = 0;

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const completion = await groq.chat.completions.create({
        model,
        temperature: 0.4,
        max_tokens: 700,
        messages,
        tools: groqTools,
        tool_choice: "auto",
      });

      promptTokens += completion.usage?.prompt_tokens ?? 0;
      completionTokens += completion.usage?.completion_tokens ?? 0;

      const choice = completion.choices[0]?.message;
      if (!choice) throw new Error("Empty response from Groq.");

      const toolCalls = choice.tool_calls ?? [];
      if (toolCalls.length === 0) {
        return {
          reply: choice.content?.trim() ?? "",
          toolCalls: allToolCalls,
          usage: { promptTokens, completionTokens },
          model,
          pendingConfirmation,
        };
      }

      messages.push({
        role: "assistant",
        content: choice.content ?? "",
        tool_calls: toolCalls,
      });

      for (const call of toolCalls) {
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(call.function.arguments || "{}");
        } catch {
          /* malformed args from the model — call with {} rather than crash the turn */
        }

        const callResult = await mcp.client.callTool({ name: call.function.name, arguments: args });
        const structured = (callResult.structuredContent as Record<string, unknown> | undefined) ?? {};
        if (structured.pendingConfirmation) {
          pendingConfirmation = structured.pendingConfirmation as ConciergePendingConfirmation;
        }

        allToolCalls.push({ name: call.function.name, args: call.function.arguments, result: structured });
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(structured),
        });
      }
    }

    return {
      reply: "I looked into a few things but I'm having trouble finishing that up — could you try rephrasing, or tell me which part matters most?",
      toolCalls: allToolCalls,
      usage: { promptTokens, completionTokens },
      model,
      pendingConfirmation,
    };
  } finally {
    await mcp.close();
  }
}

export type ConfirmOutcome =
  | { status: "not_found" }
  | { status: "executed"; toolName: string; result: object; isError: boolean };

/**
 * Re-invokes a previously-proposed action with `confirm: true` after the
 * user has explicitly approved it — either by clicking Confirm in the UI or
 * by agreeing in chat (see ConversationPanel.tsx / the system prompt).
 * `consumePendingAction` is a one-time lookup keyed to the identity that
 * proposed it (mcp/pending-actions.ts) — the id alone, without a matching
 * live session, proves nothing. Authorization is then re-derived fresh from
 * `identity` and re-checked inside the tool handler exactly as any other
 * call — the original proposal is never trusted as still valid.
 */
export async function confirmConciergeAction(
  confirmationId: string,
  identity: PlatformIdentity,
): Promise<ConfirmOutcome> {
  const pending = consumePendingAction(confirmationId, identity.userId);
  if (!pending) return { status: "not_found" };

  const authInfo = buildAuthInfo(identity, MCP_CLIENT_INTERNAL);
  const mcp = await connectInternalMcpClient(authInfo);
  try {
    const callResult = await mcp.client.callTool({
      name: pending.toolName,
      arguments: { ...pending.args, confirm: true },
    });
    const structured = (callResult.structuredContent as Record<string, unknown> | undefined) ?? {};
    return { status: "executed", toolName: pending.toolName, result: structured, isError: Boolean(callResult.isError) };
  } finally {
    await mcp.close();
  }
}
