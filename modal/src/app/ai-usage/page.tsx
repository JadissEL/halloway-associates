import { fetchAiUsageSummary } from "@/lib/root-api";

export default async function AiUsagePage() {
  let summary: Awaited<ReturnType<typeof fetchAiUsageSummary>> | null = null;
  let error: string | null = null;
  try {
    summary = await fetchAiUsageSummary();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load AI usage.";
  }

  return (
    <div className="mx-auto min-h-dvh max-w-4xl px-6 py-10">
      <h1 className="mb-2 text-2xl font-semibold text-[#e8eaed]">AI Usage</h1>
      <p className="mb-8 text-sm text-[#6b7280]">Last 30 days — goal: increase the deterministic share over time.</p>

      {error && (
        <p className="rounded-xl border border-[#1e2430] bg-[#0e1016] p-4 text-sm text-red-400">{error}</p>
      )}

      {summary && (
        <>
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Stat label="Total requests" value={summary.totalRequests.toString()} />
            <Stat label="Deterministic rate" value={`${Math.round(summary.deterministicRate * 100)}%`} />
            <Stat
              label="Est. cost"
              value={`$${Object.values(summary.byLayer).reduce((sum, l) => sum + l.costEstimateUsd, 0).toFixed(2)}`}
            />
          </div>

          <div className="space-y-3">
            {Object.entries(summary.byLayer).map(([layer, data]) => (
              <div key={layer} className="rounded-xl border border-[#1e2430] bg-[#0e1016] p-4">
                <p className="mb-1 text-sm font-medium text-[#e8eaed]">{layer}</p>
                <p className="text-xs text-[#6b7280]">
                  {data.count} requests · {data.promptTokens + data.completionTokens} tokens · ${data.costEstimateUsd.toFixed(3)}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#1e2430] bg-[#0e1016] p-4">
      <p className="text-2xl font-semibold text-[#e8eaed]">{value}</p>
      <p className="text-xs text-[#6b7280]">{label}</p>
    </div>
  );
}
