import { randomBytes, createHash } from "crypto";
import { Resend } from "resend";
import { prisma } from "@/lib/db/client";
import { safeRedirectPath } from "./safe-redirect";

const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Finds-or-creates the User for this email, issues a one-time magic-link
 * token (only the hash is persisted), and emails the sign-in link via the
 * same Resend integration already used for the contact form. If
 * RESEND_API_KEY isn't set, the link is logged instead — same fallback
 * behavior as src/app/actions/contact.ts, so local dev works without email.
 */
export async function requestMagicLink(
  email: string,
  preferredLocale: string,
  redirectPath?: string,
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.upsert({
    where: { email: normalizedEmail },
    update: {},
    create: { email: normalizedEmail, preferredLocale },
  });

  const token = randomBytes(32).toString("base64url");
  await prisma.magicLinkToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  // Re-validated here even though the request-link route already checked it
  // — this value travels through an email a user clicks minutes later, so
  // it's worth guarding at the point where it actually becomes a redirect
  // target too, not just at the point it was first submitted.
  const redirect = safeRedirectPath(redirectPath, "/account");
  const verifyUrl = `${siteUrl}/api/auth/verify?token=${token}&locale=${preferredLocale}&redirect=${encodeURIComponent(redirect)}`;

  const from = process.env.CONTACT_FROM_EMAIL ?? "onboarding@resend.dev";

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    // The Resend SDK does NOT throw on an API-level failure (e.g. the shared
    // onboarding@resend.dev sender being restricted to only deliver to the
    // account owner's own address, a very common state for an unverified
    // domain) — it resolves normally with `error` populated. Without this
    // check, a rejected send was indistinguishable from a real one: the
    // route always returned 200 and the UI always said "check your email."
    const { error } = await resend.emails.send({
      from,
      to: normalizedEmail,
      subject: "Sign in to Halloway & Associates",
      text: `Sign in with this link (expires in 15 minutes):\n\n${verifyUrl}\n\nIf you didn't request this, you can ignore this email.`,
    });
    if (error) {
      throw new Error(`Resend rejected the sign-in email: ${error.message}`);
    }
  } else {
    console.info("[magic-link]", verifyUrl);
  }
}

export interface VerifiedToken {
  userId: string;
  email: string;
}

export async function consumeMagicLink(token: string): Promise<VerifiedToken | null> {
  const tokenHash = hashToken(token);

  // Atomic claim: the conditional `where` means only one concurrent caller
  // can ever flip `usedAt` from null, so two simultaneous requests with the
  // same token (e.g. a legitimate click racing an email scanner's prefetch)
  // can't both succeed — a plain findUnique-then-update would allow that.
  const { count } = await prisma.magicLinkToken.updateMany({
    where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
  if (count === 0) return null;

  const record = await prisma.magicLinkToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (!record) return null;

  return { userId: record.user.id, email: record.user.email };
}
