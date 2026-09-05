// Thin client for the public site's internal admin API (moderation queue,
// AI usage summary). MODAL never touches the Prisma schema/database
// directly — the public site owns the single source of truth and MODAL is
// purely a UI over its internal API, gated by a shared secret header.
function rootSiteUrl(): string {
  return process.env.MODAL_SITE_URL?.trim() || "https://hallowayassociates.com";
}

function internalKey(): string {
  const key = process.env.MODAL_INTERNAL_API_KEY?.trim();
  if (!key) throw new Error("MODAL_INTERNAL_API_KEY is not set.");
  return key;
}

export interface ModerationItem {
  id: string;
  contentType: string;
  status: string;
  createdAt: string;
  property: { id: string; title: string; city: string; priceAmount: number; currency: string; isDemo: boolean } | null;
}

export async function fetchModerationQueue(): Promise<ModerationItem[]> {
  const res = await fetch(`${rootSiteUrl()}/api/internal/moderation`, {
    headers: { "x-internal-admin-key": internalKey() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Moderation queue fetch failed: ${res.status}`);
  const data = await res.json();
  return data.items;
}

export async function applyModerationAction(
  id: string,
  action: "APPROVE" | "REJECT" | "REQUEST_CHANGES" | "SUSPEND" | "FLAG" | "ESCALATE",
  note?: string,
): Promise<void> {
  const res = await fetch(`${rootSiteUrl()}/api/internal/moderation/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-internal-admin-key": internalKey() },
    body: JSON.stringify({ action, note }),
  });
  if (!res.ok) throw new Error(`Moderation action failed: ${res.status}`);
}

export interface AiUsageSummary {
  since: string;
  totalRequests: number;
  byLayer: Record<string, { count: number; promptTokens: number; completionTokens: number; costEstimateUsd: number }>;
  deterministicRate: number;
}

export async function fetchAiUsageSummary(): Promise<AiUsageSummary> {
  const res = await fetch(`${rootSiteUrl()}/api/internal/ai-usage`, {
    headers: { "x-internal-admin-key": internalKey() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`AI usage fetch failed: ${res.status}`);
  return res.json();
}
