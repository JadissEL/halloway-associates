import { fetchModerationQueue } from "@/lib/root-api";
import { moderateAction } from "@/app/actions/moderation";

const ACTIONS = ["APPROVE", "REJECT", "REQUEST_CHANGES", "SUSPEND", "FLAG", "ESCALATE"] as const;

export default async function ModerationPage() {
  let items: Awaited<ReturnType<typeof fetchModerationQueue>> = [];
  let error: string | null = null;
  try {
    items = await fetchModerationQueue();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load moderation queue.";
  }

  return (
    <div className="mx-auto min-h-dvh max-w-4xl px-6 py-10">
      <h1 className="mb-2 text-2xl font-semibold text-[#e8eaed]">Moderation Center</h1>
      <p className="mb-8 text-sm text-[#6b7280]">
        {items.length} item{items.length === 1 ? "" : "s"} pending review.
      </p>

      {error && (
        <p className="rounded-xl border border-[#1e2430] bg-[#0e1016] p-4 text-sm text-red-400">
          {error} — check INTERNAL_ADMIN_API_KEY / MODAL_INTERNAL_API_KEY match and MODAL_SITE_URL.
        </p>
      )}

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-[#1e2430] bg-[#0e1016] p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#9aa3ad]">{item.contentType}</p>
                <p className="font-medium text-[#e8eaed]">
                  {item.property?.title ?? item.id}
                  {item.property?.isDemo && <span className="ml-2 text-xs text-yellow-500">(demo)</span>}
                </p>
                {item.property && (
                  <p className="text-sm text-[#6b7280]">
                    {item.property.city} · {item.property.priceAmount} {item.property.currency}
                  </p>
                )}
              </div>
              <span className="text-xs text-[#6b7280]">{new Date(item.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {ACTIONS.map((action) => (
                <form key={action} action={moderateAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="action" value={action} />
                  <button
                    type="submit"
                    className="rounded-lg border border-[#1e2430] px-3 py-1.5 text-xs font-medium text-[#9aa3ad] hover:border-[#c0c5ce]/25 hover:text-[#e8eaed]"
                  >
                    {action.replace(/_/g, " ")}
                  </button>
                </form>
              ))}
            </div>
          </div>
        ))}
        {items.length === 0 && !error && (
          <p className="text-sm text-[#6b7280]">Nothing pending — the queue is clear.</p>
        )}
      </div>
    </div>
  );
}
