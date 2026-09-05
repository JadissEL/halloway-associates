import { prisma } from "@/lib/db/client";
import type { AiLayer } from "@prisma/client";

// Rough, deliberately-approximate cost estimate for the MODAL usage
// dashboard trend line — NOT a real invoice figure. Adjust to your actual
// Groq pricing tier/model; this exists so the dashboard can show relative
// cost trends across layers, not to bill anyone precisely.
const APPROX_USD_PER_1K_TOKENS = 0.0006;

export async function logAiUsage(entry: {
  sessionId: string;
  userId?: string | null;
  layer: AiLayer;
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  latencyMs?: number;
  toolCalls?: unknown;
}): Promise<void> {
  const promptTokens = entry.promptTokens ?? 0;
  const completionTokens = entry.completionTokens ?? 0;
  const costEstimateUsd = ((promptTokens + completionTokens) / 1000) * APPROX_USD_PER_1K_TOKENS;

  await prisma.aiUsageLog.create({
    data: {
      sessionId: entry.sessionId,
      userId: entry.userId ?? null,
      layer: entry.layer,
      model: entry.model,
      promptTokens,
      completionTokens,
      latencyMs: entry.latencyMs ?? 0,
      toolCalls: entry.toolCalls ? JSON.parse(JSON.stringify(entry.toolCalls)) : undefined,
      costEstimateUsd,
    },
  });
}
