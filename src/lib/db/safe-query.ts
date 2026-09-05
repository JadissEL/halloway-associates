// Wraps a Prisma call so a missing/unreachable DATABASE_URL (e.g. right
// after a deploy, before real env vars are set) shows a friendly fallback
// instead of crashing the page with a raw Next.js error screen.
export interface SafeQueryResult<T> {
  data: T;
  error: boolean;
}

export async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<SafeQueryResult<T>> {
  try {
    return { data: await fn(), error: false };
  } catch (error) {
    console.error("[db]", error);
    return { data: fallback, error: true };
  }
}
