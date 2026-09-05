import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";

export async function POST() {
  const session = await getSession();
  if (!session) return Response.json({ error: "unauthenticated" }, { status: 401 });

  await prisma.notification.updateMany({
    where: { userId: session.userId, isRead: false },
    data: { isRead: true },
  });

  return Response.json({ ok: true });
}
