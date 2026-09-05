import { prisma } from "@/lib/db/client";
import { getSession } from "./session";
import type { User } from "@prisma/client";

// Authorization-sensitive code should call this (fresh role/data from the
// database) rather than trusting the session cookie's payload alone, which
// only carries userId + email.
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;
  try {
    return await prisma.user.findUnique({ where: { id: session.userId } });
  } catch (error) {
    console.error("[db]", error);
    return null;
  }
}
