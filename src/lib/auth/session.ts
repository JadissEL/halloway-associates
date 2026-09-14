import { getCurrentUser } from "./current-user";

// Thin compatibility shim over the Clerk-backed getCurrentUser(), kept only
// because ~6 existing call sites across Server Actions and API routes
// (src/app/actions/*.ts, src/app/api/{account,notifications}/*) already
// destructure just {userId, email} rather than a full User row and were
// never worth touching individually for this migration — same non-
// regression approach as current-user.ts itself.
export interface SessionPayload {
  userId: string;
  email: string;
}

export async function getSession(): Promise<SessionPayload | null> {
  const user = await getCurrentUser();
  return user ? { userId: user.id, email: user.email } : null;
}
