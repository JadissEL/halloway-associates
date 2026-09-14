import { currentUser as getClerkUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/client";
import type { User } from "@prisma/client";

// Clerk is the identity provider (sign-in/sign-up, sessions, passwords/OAuth)
// — but every piece of data this app actually owns (Property.ownerId,
// RequestRoom.userId, MediaAsset.userId, User.role driving the AI
// concierge's MCP scopes, ...) is a foreign key into the local `User` table,
// keyed by our own cuid, not Clerk's user id. Rewriting every one of those
// relations to point at Clerk ids directly would be a much bigger, riskier
// migration than necessary — instead, this is the one place that bridges
// the two: look up (or create, on a user's very first post-migration
// sign-in) the local User row for whoever Clerk says is signed in, and hand
// back the same `User` shape every existing call site already expects.
// getCurrentUser()'s signature is unchanged from the pre-Clerk version on
// purpose — every one of its ~10 call sites across the app keeps working
// without modification.
export async function getCurrentUser(): Promise<User | null> {
  const clerkUser = await getClerkUser();
  if (!clerkUser) return null;

  const email =
    clerkUser.primaryEmailAddress?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;
  // Clerk's own sign-up flow requires an email/identifier before a session
  // exists, so this is defensive, not an expected path — but never invent a
  // local account for an identity with nothing to key it by.
  if (!email) {
    console.error("[auth] Clerk user has no email address", clerkUser.id);
    return null;
  }
  const normalizedEmail = email.trim().toLowerCase();
  const name = clerkUser.fullName?.trim() || undefined;

  const byClerkId = await prisma.user.findUnique({ where: { clerkUserId: clerkUser.id } });
  if (byClerkId) {
    // Keep the cached email/name in sync if they changed on Clerk's side —
    // cheap, and several places in the app (moderation, notifications)
    // display User.email directly rather than round-tripping to Clerk.
    if (byClerkId.email !== normalizedEmail || (name && byClerkId.name !== name)) {
      return prisma.user.update({
        where: { id: byClerkId.id },
        data: { email: normalizedEmail, ...(name ? { name } : {}) },
      });
    }
    return byClerkId;
  }

  // No local row for this Clerk id yet — either a brand-new sign-up, or
  // someone who already had an account from before this migration (matched
  // by email, the one continuity bridge, so their existing owned
  // properties/request rooms/etc. stay linked to the same account instead
  // of silently forking into a second one).
  const byEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (byEmail) {
    return prisma.user.update({
      where: { id: byEmail.id },
      data: { clerkUserId: clerkUser.id, ...(name && !byEmail.name ? { name } : {}) },
    });
  }

  return prisma.user.create({
    data: { email: normalizedEmail, clerkUserId: clerkUser.id, name },
  });
}
