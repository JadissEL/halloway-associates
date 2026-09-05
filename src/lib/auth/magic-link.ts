import { randomBytes, createHash } from "crypto";
import { Resend } from "resend";
import { prisma } from "@/lib/db/client";

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
  const verifyUrl = `${siteUrl}/api/auth/verify?token=${token}&locale=${preferredLocale}`;

  const from = process.env.CONTACT_FROM_EMAIL ?? "onboarding@resend.dev";

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from,
      to: normalizedEmail,
      subject: "Sign in to Halloway & Associates",
      text: `Sign in with this link (expires in 15 minutes):\n\n${verifyUrl}\n\nIf you didn't request this, you can ignore this email.`,
    });
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
  const record = await prisma.magicLinkToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return null;
  }

  await prisma.magicLinkToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return { userId: record.user.id, email: record.user.email };
}
