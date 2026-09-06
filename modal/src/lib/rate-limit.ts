// In-memory limiter — resets on restart, single-instance only. Good enough
// to stop naive password-guessing scripts against the admin login; a real
// lockout store (Upstash/Redis) is the upgrade path if this ever matters
// more than it does for a single-admin internal tool.
const attempts = new Map<string, number[]>();

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (attempts.get(key) ?? []).filter((t) => now - t < windowMs);

  if (timestamps.length >= limit) {
    attempts.set(key, timestamps);
    return true;
  }

  timestamps.push(now);
  attempts.set(key, timestamps);
  return false;
}
