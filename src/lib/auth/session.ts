import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

// Mirrors the hand-rolled HMAC-signed-cookie pattern already proven out in
// modal/src/lib/auth.ts, rather than pulling in Auth.js on a very recent
// Next major (16.2.9) where compatibility risk is real. No passwords are
// stored — see magic-link.ts for how a session actually gets created.
export const SESSION_COOKIE = "halloway_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days (was 30 — shorter window if a token ever leaks)

// Never accept an obviously-placeholder secret, even if it happens to be
// long enough — a known dev value in a real deployment lets anyone forge a
// valid session (including as an ADMINISTRATOR) by computing the same HMAC.
const KNOWN_WEAK_SECRETS = new Set([
  "dev-only-placeholder-change-me-32-chars-min",
  "dev-only-placeholder-change-me",
]);

function getSecret(): string {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret || secret.length < 32 || KNOWN_WEAK_SECRETS.has(secret) || secret.startsWith("dev-only")) {
    throw new Error(
      "AUTH_SESSION_SECRET must be set to a real random value (32+ chars, e.g. `openssl rand -hex 32`) — refusing to run with a placeholder.",
    );
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export interface SessionPayload {
  userId: string;
  email: string;
}

export function createSessionToken(session: SessionPayload): string {
  const expires = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = `${session.userId}:${session.email}:${expires}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  let expected: string;
  try {
    expected = sign(payload);
  } catch {
    return null;
  }

  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  const [userId, email, expiresRaw] = payload.split(":");
  const expires = Number(expiresRaw);
  if (!userId || !email || !expires || Date.now() > expires) return null;

  return { userId, email };
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
