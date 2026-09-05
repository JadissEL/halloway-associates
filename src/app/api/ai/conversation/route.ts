import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { detectLanguage } from "@/lib/ai/language";
import { routeDeterministically } from "@/lib/ai/router";
import { retrieveKnowledge } from "@/lib/ai/knowledge/retrieve";
import { buildConciergeSystemPrompt } from "@/lib/ai/system-prompt";
import { runConcierge } from "@/lib/ai/groq-client";
import { logAiUsage } from "@/lib/ai/usage-log";

const requestSchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(4000) }))
    .min(1)
    .max(30),
  locale: z.enum(["en", "el", "fr"]),
  sessionId: z.string().min(8).max(64),
});

export interface WorkspacePayload {
  type: "properties" | "professionals" | "requestRoom" | "callSlots" | "callBooking";
  data: unknown;
}

function deriveWorkspacePayload(
  toolCalls: { name: string; result: object }[],
): WorkspacePayload | null {
  // Last matching tool call wins — the most recent thing the user asked about.
  for (let i = toolCalls.length - 1; i >= 0; i--) {
    const { name, result } = toolCalls[i];
    if (name === "search_properties") return { type: "properties", data: result };
    if (name === "find_professionals") return { type: "professionals", data: result };
    if (name === "create_lawyer_request") return { type: "requestRoom", data: result };
    if (name === "get_available_call_slots") return { type: "callSlots", data: result };
    if (name === "create_call_booking") return { type: "callBooking", data: result };
  }
  return null;
}

export async function POST(request: Request) {
  let body: z.infer<typeof requestSchema>;
  try {
    body = requestSchema.parse(await request.json());
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const session = await getSession();
  const lastUserMessage = [...body.messages].reverse().find((m) => m.role === "user");
  const { replyLocale } = detectLanguage(lastUserMessage?.content ?? "", body.locale);

  // Layer 1 — deterministic, zero model tokens.
  const deterministic = routeDeterministically(lastUserMessage?.content ?? "", replyLocale);
  if (deterministic.handled) {
    await logAiUsage({ sessionId: body.sessionId, userId: session?.userId, layer: "DETERMINISTIC" });
    return Response.json({ reply: deterministic.reply, replyLocale, layer: "DETERMINISTIC", workspace: null });
  }

  // Layer 3 — retrieval, still no reasoning-model call yet, feeds the prompt.
  // A knowledge-layer failure (e.g. DB unreachable) shouldn't block the whole
  // reply — the concierge can still help without extra grounding, it just
  // won't state anything it can't back up (see the system prompt's rules).
  const knowledgeHits = await retrieveKnowledge(lastUserMessage?.content ?? "", { locale: replyLocale }).catch(
    (error) => {
      console.error("[ai-conversation:knowledge]", error);
      return [];
    },
  );

  // Layer 4 — full reasoning + tool-calling, only now that layers 1-3 couldn't resolve it.
  const systemPrompt = buildConciergeSystemPrompt({
    replyLocale,
    isSignedIn: Boolean(session),
    knowledgeHits,
  });

  const startedAt = Date.now();
  try {
    const result = await runConcierge(systemPrompt, body.messages, {
      userId: session?.userId ?? null,
      locale: replyLocale,
    });

    await logAiUsage({
      sessionId: body.sessionId,
      userId: session?.userId,
      layer: "REASONING",
      model: result.model,
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
      latencyMs: Date.now() - startedAt,
      toolCalls: result.toolCalls.map((t) => ({ name: t.name })),
    });

    return Response.json({
      reply: result.reply,
      replyLocale,
      layer: "REASONING",
      workspace: deriveWorkspacePayload(result.toolCalls),
    });
  } catch (error) {
    console.error("[ai-conversation]", error);
    return Response.json({ error: "Concierge unavailable." }, { status: 502 });
  }
}
