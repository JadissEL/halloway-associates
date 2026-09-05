import Groq from "groq-sdk";
import { TOOL_SCHEMAS, executeTool, type ToolContext } from "./tools";

export interface ConciergeMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ConciergeRunResult {
  reply: string;
  toolCalls: { name: string; args: string; result: object }[];
  usage: { promptTokens: number; completionTokens: number };
  model: string;
}

const MAX_TOOL_ROUNDS = 4;

/**
 * Layer 4 — Groq tool-calling loop. The model decides which tool to call;
 * this function is the only thing that actually executes it and feeds the
 * real result back (spec section 10: "AI actions must be tool-based" — the
 * AI never pretends an action happened).
 */
export async function runConcierge(
  systemPrompt: string,
  history: ConciergeMessage[],
  ctx: ToolContext,
): Promise<ConciergeRunResult> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured.");
  }
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const model = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

  const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];

  const allToolCalls: ConciergeRunResult["toolCalls"] = [];
  let promptTokens = 0;
  let completionTokens = 0;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const completion = await groq.chat.completions.create({
      model,
      temperature: 0.4,
      max_tokens: 700,
      messages,
      tools: TOOL_SCHEMAS,
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
      };
    }

    messages.push({
      role: "assistant",
      content: choice.content ?? "",
      tool_calls: toolCalls,
    });

    for (const call of toolCalls) {
      const result = await executeTool(call.function.name, call.function.arguments, ctx);
      allToolCalls.push({ name: call.function.name, args: call.function.arguments, result });
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }

  return {
    reply: "I looked into a few things but I'm having trouble finishing that up — could you try rephrasing, or tell me which part matters most?",
    toolCalls: allToolCalls,
    usage: { promptTokens, completionTokens },
    model,
  };
}
