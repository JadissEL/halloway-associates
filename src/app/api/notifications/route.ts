import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "unauthenticated" }, { status: 401 });

  let notifications: Awaited<ReturnType<typeof prisma.notification.findMany>>;
  try {
    notifications = await prisma.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  } catch (error) {
    console.error("[notifications]", error);
    return Response.json({ error: "service_unavailable" }, { status: 503 });
  }

  return Response.json({
    notifications: notifications.map((n) => ({
      id: n.id,
      message: n.message,
      isRead: n.isRead,
      requestRoomId: n.requestRoomId,
      createdAt: n.createdAt.toISOString(),
    })),
    unreadCount: notifications.filter((n) => !n.isRead).length,
  });
}
