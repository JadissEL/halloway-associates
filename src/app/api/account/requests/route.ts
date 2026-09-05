import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";

const TERMINAL_STATUSES = new Set(["COMPLETED", "CANCELLED"]);

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }

  const rooms = await prisma.requestRoom.findMany({
    where: { userId: session.userId },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  const savedItems = await prisma.savedItem.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const serialized = rooms.map((r) => ({
    id: r.id,
    type: r.type,
    status: r.status,
    updatedAt: r.updatedAt.toISOString(),
  }));

  return Response.json({
    recent: serialized.slice(0, 5),
    active: serialized.filter((r) => !TERMINAL_STATUSES.has(r.status)),
    history: serialized.filter((r) => TERMINAL_STATUSES.has(r.status)),
    saved: savedItems.map((s) => ({ itemType: s.itemType, itemId: s.itemId })),
  });
}
