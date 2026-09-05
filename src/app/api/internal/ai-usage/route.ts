import { isAuthorizedInternalRequest } from "@/lib/internal-auth";
import { prisma } from "@/lib/db/client";

export async function GET(request: Request) {
  if (!isAuthorizedInternalRequest(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const logs = await prisma.aiUsageLog.findMany({
    where: { createdAt: { gte: since } },
  });

  const byLayer: Record<string, { count: number; promptTokens: number; completionTokens: number; costEstimateUsd: number }> = {};
  for (const log of logs) {
    const bucket = (byLayer[log.layer] ??= { count: 0, promptTokens: 0, completionTokens: 0, costEstimateUsd: 0 });
    bucket.count += 1;
    bucket.promptTokens += log.promptTokens;
    bucket.completionTokens += log.completionTokens;
    bucket.costEstimateUsd += log.costEstimateUsd;
  }

  const total = logs.length;
  const deterministicRate = total > 0 ? (byLayer.DETERMINISTIC?.count ?? 0) / total : 0;

  return Response.json({
    since: since.toISOString(),
    totalRequests: total,
    byLayer,
    deterministicRate,
  });
}
