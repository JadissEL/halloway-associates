import { createHmac, timingSafeEqual } from "crypto";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth-edge";

export { SESSION_COOKIE, SESSION_MAX_AGE };

function getSessionSecret(): string | null {
  const secret = process.env.MODAL_SESSION_SECRET;
  if (!secret || secret.length < 16) return null;
  return secret;
}

function signNode(payload: string): string | null {
  const secret = getSessionSecret();
  if (!secret) return null;
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function createSessionToken(): string {
  if (!getSessionSecret()) {
    throw new Error("MODAL_SESSION_SECRET must be set (16+ characters)");
  }
  const expires = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = `admin:${expires}`;
  const signature = signNode(payload);
  if (!signature) {
    throw new Error("MODAL_SESSION_SECRET must be set (16+ characters)");
  }
  return `${payload}.${signature}`;
}

export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.MODAL_ADMIN_PASSWORD?.trim();
  if (!expected || expected === "change-me-to-a-strong-password") {
    return false;
  }
  const input = password.trim();
  try {
    const a = Buffer.from(input);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
};
