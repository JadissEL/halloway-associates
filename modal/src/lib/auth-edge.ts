export const SESSION_COOKIE = "modal_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function getSessionSecret(): string | null {
  const secret = process.env.MODAL_SESSION_SECRET;
  if (!secret || secret.length < 16) return null;
  return secret;
}

async function sign(payload: string): Promise<string | null> {
  const secret = getSessionSecret();
  if (!secret) return null;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );

  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifySessionToken(
  token: string | undefined,
): Promise<boolean> {
  if (!token || !getSessionSecret()) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = await sign(payload);
  if (!expected) return false;

  if (signature.length !== expected.length) return false;

  let mismatch = 0;
  for (let i = 0; i < signature.length; i++) {
    mismatch |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (mismatch !== 0) return false;

  const [, expiresRaw] = payload.split(":");
  const expires = Number(expiresRaw);
  return Number.isFinite(expires) && expires > Date.now();
}
