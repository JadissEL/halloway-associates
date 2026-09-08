// In-memory sliding-window rate limiter. Deliberately simple: this resets on
// every deploy/restart and doesn't coordinate across multiple server
// instances — acceptable for Phase 1 on a single Render instance, but the
// real fix if this app ever scales horizontally is Upstash/Vercel KV with
// the same call signature. Better than the zero rate limiting that existed
// before, which is the actual bar being cleared here.
const buckets = new Map<string, number[]>();

// Bound memory: without this, an attacker rotating keys (e.g. random emails)
// grows this map forever between the periodic sweep below.
const MAX_TRACKED_KEYS = 50_000;

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);

  if (timestamps.length >= limit) {
    buckets.set(key, timestamps);
    return true;
  }

  timestamps.push(now);
  if (buckets.size >= MAX_TRACKED_KEYS && !buckets.has(key)) {
    // Cheap eviction under pressure rather than unbounded growth.
    const oldestKey = buckets.keys().next().value;
    if (oldestKey) buckets.delete(oldestKey);
  }
  buckets.set(key, timestamps);
  return false;
}

// Takes Headers rather than a Request so it also works from Server Actions
// (which get next/headers()'s ReadonlyHeaders, not a Request object) as well
// as route handlers (pass request.headers).
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
