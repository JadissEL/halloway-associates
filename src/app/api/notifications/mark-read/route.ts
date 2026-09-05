import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";

export async function POST() {
  const session = await getSession();
  if (!session) return Response.json({ error: "unauthenticated" }, { status: 401 });

  try {
    await prisma.notification.updateMany({
      where: { userId: session.userId, isRead: false },
      data: { isRead: true },
    });
  } catch (error) {
    console.error("[notifications-mark-read]", error);
    return Response.json({ error: "service_unavailable" }, { status: 503 });
  }

  return Response.json({ ok: true });
}
