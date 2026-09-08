import { randomBytes } from "crypto";

// Server-side store for actions a tool has validated and proposed but not
// yet executed (risk tier MEDIUM+, see risk.ts). The chat UI shows Confirm/
// Cancel; Confirm sends back only the opaque id — never the raw tool
// arguments — and confirmMcpAction() (mcp/server.ts) re-validates
// authorization fresh against a User row read at confirm time, not a cached
// claim, before executing. In-memory and single-instance, same tradeoff
// already accepted by rate-limit.ts for this Phase-1 deployment; the fix if
// this app ever runs multiple instances is a shared store with the same
// call signature.
interface PendingAction {
  toolName: string;
  args: Record<string, unknown>;
  userId: string | null;
  createdAt: number;
}

const PENDING_TTL_MS = 5 * 60 * 1000;
const MAX_PENDING = 10_000;
const pending = new Map<string, PendingAction>();

function sweepExpired() {
  const now = Date.now();
  for (const [id, action] of pending) {
    if (now - action.createdAt > PENDING_TTL_MS) pending.delete(id);
  }
}

export function createPendingAction(toolName: string, args: Record<string, unknown>, userId: string | null): string {
  if (pending.size >= MAX_PENDING) sweepExpired();
  const id = randomBytes(16).toString("hex");
  pending.set(id, { toolName, args, userId, createdAt: Date.now() });
  return id;
}

// One-time use: consuming (whether the confirmation succeeds or not) removes
// the entry, so a confirmationId can't be replayed.
export function consumePendingAction(id: string, callerUserId: string | null): PendingAction | null {
  const action = pending.get(id);
  if (!action) return null;
  pending.delete(id);
  if (Date.now() - action.createdAt > PENDING_TTL_MS) return null;
  // Must be confirmed by the same identity that proposed it — an anonymous
  // proposal (userId: null) can only be confirmed anonymously too, and a
  // signed-in user can never confirm another user's pending action.
  if (action.userId !== callerUserId) return null;
  return action;
}
